// ProfileGuard — Manifest V3 Content Script
// Extracts visible, non-private profile elements strictly with active analyst intent.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_PREVIEW') {
    const handle = extractHandle();
    sendResponse({ handle });
  } else if (request.action === 'PERFORM_CAPTURE') {
    const profile = extractVisibleProfileData();
    sendResponse(profile);
  }
  return true;
});

function extractHandle() {
  const url = window.location.href;
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length > 0) {
    return pathParts[0].replace('@', '');
  }
  return 'unknown';
}

function extractVisibleProfileData() {
  const handle = extractHandle();
  let bio = '';
  let followers = 0;
  let following = 0;
  let posts = 0;

  // Platform heuristics for visible elements
  if (window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com')) {
    const bioEl = document.querySelector('[data-testid="UserDescription"]');
    if (bioEl) bio = bioEl.innerText;

    const followLinks = document.querySelectorAll('a[href$="/verified_followers"], a[href$="/followers"], a[href$="/following"]');
    followLinks.forEach((el) => {
      const text = el.innerText;
      if (text.includes('Following')) {
        following = parseCount(text);
      } else if (text.includes('Followers')) {
        followers = parseCount(text);
      }
    });
  } else if (window.location.hostname.includes('instagram.com')) {
    const metaDesc = document.querySelector('meta[name="description"], meta[property="og:description"]');
    if (metaDesc) {
      const content = metaDesc.content;
      // Format: "X Followers, Y Following, Z Posts - See Instagram photos..."
      const match = content.match(/([\d,KkMm\.]+)\s+Followers,\s+([\d,KkMm\.]+)\s+Following,\s+([\d,KkMm\.]+)\s+Posts/i);
      if (match) {
        followers = parseCount(match[1]);
        following = parseCount(match[2]);
        posts = parseCount(match[3]);
      }
    }
    // Fallback to DOM elements if meta tag is delayed
    if (!followers && !following) {
      const headerStats = document.querySelectorAll('header section ul li, header ul li, ul li');
      headerStats.forEach((li) => {
        const text = (li.innerText || '').toLowerCase();
        if (text.includes('post')) posts = parseCount(text);
        else if (text.includes('follower')) followers = parseCount(text);
        else if (text.includes('following')) following = parseCount(text);
      });
    }
    const bioEl = document.querySelector('header section div.-vDIg, header h1 ~ div, header h1 + div, header section > div:last-child');
    if (bioEl && !bio) {
      bio = bioEl.innerText || '';
    }
  }

  return {
    handle,
    url: window.location.href,
    bio,
    followers,
    following,
    posts,
    captured_at: new Date().toISOString(),
  };
}

function parseCount(str) {
  if (!str) return 0;
  const clean = str.replace(/[^0-9KkMm\.]/g, '').toUpperCase();
  if (clean.includes('K')) return Math.round(parseFloat(clean) * 1000);
  if (clean.includes('M')) return Math.round(parseFloat(clean) * 1000000);
  return parseInt(clean, 10) || 0;
}
