document.addEventListener('DOMContentLoaded', async () => {
  const platformSpan = document.getElementById('detected-platform');
  const handleSpan = document.getElementById('detected-handle');
  const captureBtn = document.getElementById('capture-btn');
  const statusDiv = document.getElementById('result-status');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    platformSpan.innerText = 'Unsupported Tab';
    captureBtn.disabled = true;
    return;
  }

  let platform = 'unknown';
  if (tab.url.includes('twitter.com') || tab.url.includes('x.com')) platform = 'x';
  else if (tab.url.includes('instagram.com')) platform = 'instagram';
  else if (tab.url.includes('facebook.com')) platform = 'facebook';
  else if (tab.url.includes('telegram.org')) platform = 'telegram';

  platformSpan.innerText = platform.toUpperCase();

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'GET_PREVIEW' });
    if (response && response.handle) {
      handleSpan.innerText = '@' + response.handle;
    } else {
      handleSpan.innerText = 'Profile page required';
      captureBtn.disabled = true;
    }
  } catch (err) {
    handleSpan.innerText = 'Reload target page';
  }

  captureBtn.addEventListener('click', async () => {
    captureBtn.disabled = true;
    statusDiv.innerText = 'Extracting forensic profile signals...';

    try {
      const captureData = await chrome.tabs.sendMessage(tab.id, { action: 'PERFORM_CAPTURE' });
      if (!captureData) {
        statusDiv.innerText = 'Failed to capture visible elements.';
        captureBtn.disabled = false;
        return;
      }

      // Transmit to ProfileGuard local backend
      const res = await fetch('http://localhost:8000/scan/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform,
          handle_or_url: tab.url,
          raw_profile_data: captureData,
          capture_source: 'extension',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        statusDiv.innerHTML = `<span style="color:#68D391;">Transmitted! Risk: ${(data.score * 100).toFixed(0)}% (${data.band})</span>`;
      } else {
        statusDiv.innerText = 'Backend rejected submission. Is server running?';
        captureBtn.disabled = false;
      }
    } catch (err) {
      statusDiv.innerText = 'Transmission error: ' + err.message;
      captureBtn.disabled = false;
    }
  });
});
