export type RiskBand = 'HIGH' | 'MEDIUM' | 'LOW';
export type Platform = 'instagram' | 'facebook' | 'x' | 'telegram';
export type AccountStatus = 'flagged' | 'under_review' | 'confirmed_fake' | 'genuine' | 'sent_to_cell';

export interface ContributingFeature {
  name: string;
  weight: number; // positive = pushes fake, negative = pushes genuine
  value: string;
  explanation: string;
}

export interface MockAccount {
  id: string;
  handle: string;
  name: string;
  platform: Platform;
  score: number;
  band: RiskBand;
  status: AccountStatus;
  followers: number;
  following: number;
  posts: number;
  accountAgeDays: number;
  bio: string;
  link?: string;
  hasProfilePic: boolean;
  profilePicUrl?: string;
  profileType?: string;
  dataSource?: string; // 'live_scraped_instaloader' | 'live_scraped_playwright_instagram' | 'live_meta_httpx' | 'gemini_osint' | 'heuristic'
  usernameDigitRatio: number;
  slaDueMinutes: number; // minutes remaining for SLA
  evidenceHash: string;
  prevHash: string;
  contributingFeatures: ContributingFeature[];
  urlReputation: {
    safe: boolean;
    threats: string[];
    testedUrl: string;
  };
  imageMatch: {
    distance: number;
    matchedInsignia: string;
    isTheft: boolean;
  };
  isBiasCheckSample?: boolean;
}

export const mockAccounts: MockAccount[] = [
  // Required Seed 1
  {
    id: "acc-001",
    handle: "officer_rajesh_8841",
    name: "Rajesh Kumar (ITBP Officer)",
    platform: "instagram",
    score: 0.84,
    band: "HIGH",
    status: "flagged",
    followers: 1420,
    following: 3890,
    posts: 12,
    accountAgeDays: 18,
    bio: "आईटीबीपी कमांडो | Serving the nation at Indo-China border. DM for recruitment guidance.",
    link: "http://malware.testing.google.test/testing/itbp-join",
    hasProfilePic: true,
    usernameDigitRatio: 0.21,
    slaDueMinutes: 145, // < 3h
    evidenceHash: "a7f3e829b41c09d5e38192a6c08e5f14",
    prevHash: "00000000000000000000000000000000",
    contributingFeatures: [
      { name: "Follower-to-following ratio", weight: 0.34, value: "0.36", explanation: "Follows 3x more users than followers; common in botnet seeding." },
      { name: "Account age", weight: 0.28, value: "18 days", explanation: "Freshly created profile claiming senior officer seniority." },
      { name: "Username digit count", weight: 0.18, value: "4 digits", explanation: "Automated handle generation pattern." },
      { name: "Devanagari threat keywords", weight: 0.12, value: "कमांडो, recruitment", explanation: "Targeted impersonation of tactical force personnel." }
    ],
    urlReputation: { safe: false, threats: ["MALWARE", "PHISHING"], testedUrl: "http://malware.testing.google.test/testing/itbp-join" },
    imageMatch: { distance: 4, matchedInsignia: "ITBP Official Circular Crest", isTheft: true }
  },
  // Required Seed 2
  {
    id: "acc-002",
    handle: "itbp_recruit_2024",
    name: "ITBP Bharti Board Official",
    platform: "facebook",
    score: 0.91,
    band: "HIGH",
    status: "flagged",
    followers: 89,
    following: 2450,
    posts: 4,
    accountAgeDays: 6,
    bio: "गृह मंत्रालय द्वारा अनुमोदित सीधी भर्ती 2024 | Pay application processing fee ₹450 to confirm call letter.",
    link: "http://payment.recruitment-fake.in/fee",
    hasProfilePic: true,
    usernameDigitRatio: 0.24,
    slaDueMinutes: 28, // < 30m RED PULSE
    evidenceHash: "c4b901e8a27d5f69c3821049b71e8a9f",
    prevHash: "a7f3e829b41c09d5e38192a6c08e5f14",
    contributingFeatures: [
      { name: "Extortion keyword match", weight: 0.42, value: "fee ₹450, सीधी भर्ती", explanation: "Unsanctioned monetary fee solicitations for govt employment." },
      { name: "Follower-to-following ratio", weight: 0.31, value: "0.03", explanation: "Extremely asymmetric following footprint." },
      { name: "Account age", weight: 0.25, value: "6 days", explanation: "Created inside current active recruiting cycle." }
    ],
    urlReputation: { safe: false, threats: ["FINANCIAL_FRAUD"], testedUrl: "http://payment.recruitment-fake.in/fee" },
    imageMatch: { distance: 2, matchedInsignia: "MHA Emblem & Lion Capital", isTheft: true }
  },
  // Required Seed 3
  {
    id: "acc-003",
    handle: "bsf.jawan.fan",
    name: "Himveer & BSF Fan Club",
    platform: "x",
    score: 0.62,
    band: "MEDIUM",
    status: "under_review",
    followers: 4320,
    following: 1120,
    posts: 310,
    accountAgeDays: 412,
    bio: "Non-official fan page dedicated to ITBP and BSF bravehearts. जय हिन्द, वन्दे मातरम्।",
    hasProfilePic: true,
    usernameDigitRatio: 0.0,
    slaDueMinutes: 890,
    evidenceHash: "e58129a0c4f83d719e20516b83f0927c",
    prevHash: "c4b901e8a27d5f69c3821049b71e8a9f",
    contributingFeatures: [
      { name: "Devanagari force mentions", weight: 0.22, value: "जय हिन्द, ITBP", explanation: "High force mention density without verified disclaimers." },
      { name: "Unverified badge", weight: 0.15, value: "No badge", explanation: "Third-party entity referencing official insignia." },
      { name: "Account age", weight: -0.19, value: "412 days", explanation: "Long-standing account reduces sudden campaign probability." }
    ],
    urlReputation: { safe: true, threats: [], testedUrl: "" },
    imageMatch: { distance: 16, matchedInsignia: "General Military Vehicle", isTheft: false }
  },
  // Required Seed 4
  {
    id: "acc-004",
    handle: "priya.sharma",
    name: "Priya Sharma",
    platform: "instagram",
    score: 0.39,
    band: "LOW",
    status: "genuine",
    followers: 680,
    following: 540,
    posts: 88,
    accountAgeDays: 920,
    bio: "Architecture enthusiast. Photography & hiking across Himachal. शिमला | कुल्लू",
    hasProfilePic: true,
    usernameDigitRatio: 0.0,
    slaDueMinutes: 2100,
    evidenceHash: "8b72e01a93c4d5f78219460e5b82c19a",
    prevHash: "e58129a0c4f83d719e20516b83f0927c",
    contributingFeatures: [
      { name: "Balanced follow ratio", weight: -0.32, value: "1.25", explanation: "Natural organic social network graph." },
      { name: "Account age", weight: -0.26, value: "920 days", explanation: "Established account with consistent post frequency." },
      { name: "Clean link profile", weight: -0.15, value: "None", explanation: "Zero external phishing or redirection endpoints." }
    ],
    urlReputation: { safe: true, threats: [], testedUrl: "" },
    imageMatch: { distance: 48, matchedInsignia: "None", isTheft: false }
  },
  // Genuine Hindi Bias-Check Sample 1
  {
    id: "acc-005",
    handle: "sunita_verma_pahari",
    name: "सुनीता वर्मा",
    platform: "instagram",
    score: 0.22,
    band: "LOW",
    status: "genuine",
    followers: 195,
    following: 210,
    posts: 34,
    accountAgeDays: 640,
    bio: "उत्तराखंड की हस्तशिल्प और जैविक खेती। स्थानीय उत्पाद संवर्धन। जय बद्री विशाल।",
    hasProfilePic: true,
    usernameDigitRatio: 0.0,
    slaDueMinutes: 4200,
    evidenceHash: "1948ba5c902e4f71a8e29304b81c95e0",
    prevHash: "8b72e01a93c4d5f78219460e5b82c19a",
    isBiasCheckSample: true,
    contributingFeatures: [
      { name: "Natural language structure", weight: -0.35, value: "Devanagari dialect", explanation: "Authentic local craft bio with zero impersonation terms." },
      { name: "Low velocity", weight: -0.22, value: "0.05 posts/day", explanation: "Normal private user rhythm." }
    ],
    urlReputation: { safe: true, threats: [], testedUrl: "" },
    imageMatch: { distance: 54, matchedInsignia: "None", isTheft: false }
  },
  // Genuine Hindi Bias-Check Sample 2
  {
    id: "acc-006",
    handle: "ladakh_border_diary",
    name: "स्टैनज़िन दोरजे (Stanzin Dorjey)",
    platform: "x",
    score: 0.31,
    band: "LOW",
    status: "genuine",
    followers: 820,
    following: 610,
    posts: 190,
    accountAgeDays: 850,
    bio: "लेह लद्दाख से दैनिक मौसम और सडक अपडेट। ITBP जवानों की सेवा को हमारा सादर नमन।",
    hasProfilePic: true,
    usernameDigitRatio: 0.0,
    slaDueMinutes: 3800,
    evidenceHash: "6f901a8e3b5c4d72819204e7b81c95a2",
    prevHash: "1948ba5c902e4f71a8e29304b81c95e0",
    isBiasCheckSample: true,
    contributingFeatures: [
      { name: "Community gratitude mention", weight: 0.12, value: "ITBP जवानों", explanation: "Positive public support sentiment, no claim of rank." },
      { name: "Consistent geotag history", weight: -0.28, value: "Leh, Ladakh", explanation: "Geographic origin matches long-term telemetry." }
    ],
    urlReputation: { safe: true, threats: [], testedUrl: "" },
    imageMatch: { distance: 38, matchedInsignia: "Himalayan Landscape", isTheft: false }
  },
  // Additional Diverse Accounts (Total 40 fixtures seeded)
  ...Array.from({ length: 34 }).map((_, i) => {
    const idx = i + 7;
    const isHigh = idx % 3 === 0;
    const isMed = idx % 3 === 1;
    const score = isHigh ? 0.81 + (idx % 15) * 0.01 : isMed ? 0.52 + (idx % 25) * 0.01 : 0.18 + (idx % 20) * 0.01;
    const band: RiskBand = score >= 0.80 ? 'HIGH' : score >= 0.50 ? 'MEDIUM' : 'LOW';
    const platforms: Platform[] = ['instagram', 'facebook', 'x', 'telegram'];
    const p = platforms[idx % platforms.length];
    
    return {
      id: `acc-${String(idx).padStart(3, '0')}`,
      handle: isHigh 
        ? `itbp_recruitment_alert_${idx}9` 
        : isMed 
        ? `border_security_updates_${idx}` 
        : `himachal_traveler_${idx}`,
      name: isHigh 
        ? `ITBP भर्ती बोर्ड (सैनिक चयन केंद्र ${idx})` 
        : isMed 
        ? `Security Observer Desk ${idx}` 
        : `Aarav Sharma ${idx}`,
      platform: p,
      score: Number(score.toFixed(2)),
      band,
      status: (isHigh ? 'flagged' : isMed ? 'under_review' : 'genuine') as AccountStatus,
      followers: isHigh ? 24 + idx * 3 : 500 + idx * 45,
      following: isHigh ? 2100 + idx * 80 : 320 + idx * 12,
      posts: isHigh ? 3 + (idx % 5) : 45 + idx * 4,
      accountAgeDays: isHigh ? 4 + (idx % 14) : 210 + idx * 15,
      bio: isHigh 
        ? `सीधी भर्ती 2024 सूचना केंद्र | अग्रिम शुल्क ₹${200 + idx * 10} जमा करें` 
        : `Regional Himalayan border intelligence notes and dispatches.`,
      link: isHigh ? `http://scam-verification-${idx}.gov.in.fake` : undefined,
      hasProfilePic: !isHigh,
      usernameDigitRatio: isHigh ? 0.35 : 0.0,
      slaDueMinutes: isHigh ? 45 + (idx % 180) : 1400 + idx * 60,
      evidenceHash: `hash-${idx}-${score.toFixed(2)}`,
      prevHash: `hash-${idx - 1}-prev`,
      contributingFeatures: [
        { name: "Follower asymmetry", weight: isHigh ? 0.35 : -0.2, value: isHigh ? "0.02" : "1.8", explanation: isHigh ? "Bot acquisition pattern" : "Normal network" }
      ],
      urlReputation: { safe: !isHigh, threats: isHigh ? ["PHISHING"] : [], testedUrl: isHigh ? "http://suspicious.site" : "" },
      imageMatch: { distance: isHigh ? 6 : 42, matchedInsignia: isHigh ? "ITBP Emblem" : "None", isTheft: isHigh }
    };
  })
];
