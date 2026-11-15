export type CaseStatus = 'drafted' | 'with_nodal_cell' | 'notice_filed' | 'actioned' | 'rejected_appealed';

export interface TakedownCase {
  id: string;
  caseRef: string;
  targetHandle: string;
  targetName: string;
  platform: 'instagram' | 'facebook' | 'x' | 'telegram';
  riskScore: number;
  status: CaseStatus;
  statutoryBasis: string;
  slaDueMinutes: number;
  createdAt: string;
  assignedAnalyst: string;
  evidenceSummary: {
    followers: number;
    following: number;
    accountAgeDays: number;
    sha256EvidenceHash: string;
    identifiedViolations: string[];
    safeBrowsingStatus: string;
  };
  timeline: {
    time: string;
    title: string;
    actor: string;
    detail: string;
  }[];
  noticeDraft: {
    addressedTo: string;
    section: string;
    deadlineHours: number;
    body: string;
  };
  appealReason?: string;
}

export const mockCases: TakedownCase[] = [
  {
    id: "case-001",
    caseRef: "ITBP-PG-2026-0841",
    targetHandle: "@officer_rajesh_8841",
    targetName: "Rajesh Kumar (ITBP Officer)",
    platform: "instagram",
    riskScore: 0.84,
    status: "with_nodal_cell",
    statutoryBasis: "Section 79(3)(b) Information Technology Act",
    slaDueMinutes: 145,
    createdAt: "2026-11-16 02:10 UTC",
    assignedAnalyst: "Insp. Rajesh Kumar (NC-104)",
    evidenceSummary: {
      followers: 1420,
      following: 3890,
      accountAgeDays: 18,
      sha256EvidenceHash: "a7f3e829b41c09d5e38192a6c08e5f14e912bc48d901a238e9102c48d910283a",
      identifiedViolations: ["Impersonation of Uniformed Officer", "Malicious External Linkage", "Recruitment Scam Inducement"],
      safeBrowsingStatus: "MALWARE & PHISHING CONFIRMED"
    },
    timeline: [
      { time: "02:04 UTC", title: "Evidence Ingested", actor: "Extension Capture", detail: "DOM telemetry and screenshot captured by officer." },
      { time: "02:05 UTC", title: "Multi-Signal ML Classification", actor: "RF Model Engine", detail: "Assessed as HIGH RISK (0.84)." },
      { time: "02:10 UTC", title: "Confirmed by Analyst", actor: "Insp. Rajesh Kumar", detail: "Case drafted and forwarded to Nodal Cell." }
    ],
    noticeDraft: {
      addressedTo: "Grievance Officer, Meta Platforms Inc.",
      section: "Section 79(3)(b) IT Act & Rule 3(1)(d) IT Rules 2026",
      deadlineHours: 36,
      body: "Pursuant to Section 79(3)(b) of the Information Technology Act 2000, you are hereby notified of the unlawful activity being conducted via account @officer_rajesh_8841. Immediate removal is requested within statutory timelines."
    }
  },
  {
    id: "case-002",
    caseRef: "ITBP-PG-2026-0912",
    targetHandle: "@itbp_recruit_2024",
    targetName: "ITBP Bharti Board Official",
    platform: "facebook",
    riskScore: 0.91,
    status: "notice_filed",
    statutoryBasis: "Rule 3(1)(d) IT Rules (Emergency Direct)",
    slaDueMinutes: 28, // Urgent SLA pulse
    createdAt: "2026-11-16 01:25 UTC",
    assignedAnalyst: "Sub-Insp. Anita Singh",
    evidenceSummary: {
      followers: 89,
      following: 2450,
      accountAgeDays: 6,
      sha256EvidenceHash: "c4b901e8a27d5f69c3821049b71e8a9fd8201a4e92b81029c48192a01928471b",
      identifiedViolations: ["Extortion of Application Fees", "MHA Emblem Logo Theft", "Unlawful Govt Representation"],
      safeBrowsingStatus: "FINANCIAL FRAUD SITE"
    },
    timeline: [
      { time: "01:20 UTC", title: "Citizen Grievance Received", actor: "Telegram Bot", detail: "Citizen reported fake fee demand of ₹450." },
      { time: "01:25 UTC", title: "Urgent Notice Transmitted", actor: "Nodal Officer", detail: "Notice filed with Meta Law Enforcement Response Team." }
    ],
    noticeDraft: {
      addressedTo: "Meta Law Enforcement Response Team (LERT)",
      section: "Rule 3(1)(d) Urgent 3-Hour Government Notice",
      deadlineHours: 3,
      body: "Emergency order for immediate takedown under Rule 3(1)(d). Malicious financial extortion impersonating central armed forces."
    }
  },
  {
    id: "case-003",
    caseRef: "ITBP-PG-2026-0620",
    targetHandle: "@bsf.jawan.fan",
    targetName: "Himveer & BSF Fan Club",
    platform: "x",
    riskScore: 0.62,
    status: "drafted",
    statutoryBasis: "Rule 3(2) General Grievance",
    slaDueMinutes: 890,
    createdAt: "2026-11-16 03:40 UTC",
    assignedAnalyst: "Insp. Rajesh Kumar",
    evidenceSummary: {
      followers: 4320,
      following: 1120,
      accountAgeDays: 412,
      sha256EvidenceHash: "e58129a0c4f83d719e20516b83f0927c89102938a1928374b91029384719283c",
      identifiedViolations: ["Unsanctioned Insignia Use", "Ambiguous Official Affiliation"],
      safeBrowsingStatus: "CLEAN"
    },
    timeline: [
      { time: "03:40 UTC", title: "Flagged in Routine Scan", actor: "Keyword Ingest", detail: "High density of force tags." }
    ],
    noticeDraft: {
      addressedTo: "X Corp. Resident Grievance Officer",
      section: "Rule 3(2) IT Rules 2026",
      deadlineHours: 36,
      body: "Notice requiring clarification and prominent non-official disclaimer under Rule 3(2)."
    }
  },
  {
    id: "case-004",
    caseRef: "ITBP-PG-2026-0391",
    targetHandle: "@ladakh_border_diary",
    targetName: "स्टैनज़िन दोरजे (Stanzin Dorjey)",
    platform: "x",
    riskScore: 0.31,
    status: "rejected_appealed",
    statutoryBasis: "Appeal under Rule 3A Grievance Appellate Committee",
    slaDueMinutes: 3800,
    createdAt: "2026-11-15 18:00 UTC",
    assignedAnalyst: "Nodal Cell Supervisor",
    appealReason: "Account confirmed as authentic local civilian chronicler expressing bona fide goodwill. Zero impersonation.",
    evidenceSummary: {
      followers: 820,
      following: 610,
      accountAgeDays: 850,
      sha256EvidenceHash: "6f901a8e3b5c4d72819204e7b81c95a2819203948b1928374c8192039481920f",
      identifiedViolations: ["None (Cleared on Appeal)"],
      safeBrowsingStatus: "CLEAN"
    },
    timeline: [
      { time: "18:00 UTC", title: "Initially Flagged", actor: "Automated Tag Crawler", detail: "Contained border keywords." },
      { time: "18:30 UTC", title: "Appeal Reviewed & Cleared", actor: "Nodal Officer", detail: "Flag dismissed; designated as verified genuine local account." }
    ],
    noticeDraft: {
      addressedTo: "N/A",
      section: "Cleared",
      deadlineHours: 0,
      body: "Case dismissed without notice transmission."
    }
  },
  {
    id: "case-005",
    caseRef: "ITBP-PG-2026-0994",
    targetHandle: "@mha_direct_recruitment_2024",
    targetName: "MHA Central Portal",
    platform: "facebook",
    riskScore: 0.94,
    status: "actioned",
    statutoryBasis: "Section 79(3)(b) & Section 66D IT Act",
    slaDueMinutes: 0,
    createdAt: "2026-11-15 10:12 UTC",
    assignedAnalyst: "Insp. Rajesh Kumar",
    evidenceSummary: {
      followers: 12,
      following: 3400,
      accountAgeDays: 2,
      sha256EvidenceHash: "f4019283e8192c74a91029384b81920394819203948b1928374c819203948192",
      identifiedViolations: ["Impersonation of MHA Secretariat", "Extortion", "Phishing"],
      safeBrowsingStatus: "MALWARE"
    },
    timeline: [
      { time: "10:12 UTC", title: "Notice Dispatched to Meta", actor: "Nodal Cell", detail: "Sent with statutory 3-hour timer." },
      { time: "11:45 UTC", title: "Account Suspended by Platform", actor: "Meta LERT", detail: "Platform confirmed account termination under Community Standards." }
    ],
    noticeDraft: {
      addressedTo: "Meta Law Enforcement Response Team",
      section: "Section 79(3)(b)",
      deadlineHours: 3,
      body: "Completed actioned takedown notice."
    }
  }
];
