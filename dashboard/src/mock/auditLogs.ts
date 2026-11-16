export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  targetHandle: string;
  prevHash: string;
  thisHash: string;
  isTampered?: boolean;
}

export const mockAuditLogs: AuditEntry[] = [
  {
    id: "log-001",
    timestamp: "2026-11-16 01:14:22 UTC",
    action: "GENESIS_INITIALIZE",
    actor: "SYSTEM",
    targetHandle: "SYSTEM_ROOT",
    prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
    thisHash: "a7f3e829b41c09d5e38192a6c08e5f14e912bc48d901a238e9102c48d910283a"
  },
  {
    id: "log-002",
    timestamp: "2026-11-16 02:04:10 UTC",
    action: "PROFILE_INGESTED",
    actor: "Cyber Analyst (Active Session)",
    targetHandle: "@tactical_guard_ops",
    prevHash: "a7f3e829b41c09d5e38192a6c08e5f14e912bc48d901a238e9102c48d910283a",
    thisHash: "c4b901e8a27d5f69c3821049b71e8a9fd8201a4e92b81029c48192a01928471b"
  },
  {
    id: "log-003",
    timestamp: "2026-11-16 02:05:45 UTC",
    action: "RISK_EVALUATED_HIGH",
    actor: "ML_ENGINE_RF_V1",
    targetHandle: "@tactical_guard_ops",
    prevHash: "c4b901e8a27d5f69c3821049b71e8a9fd8201a4e92b81029c48192a01928471b",
    thisHash: "e58129a0c4f83d719e20516b83f0927c89102938a1928374b91029384719283c"
  },
  {
    id: "log-004",
    timestamp: "2026-11-16 02:40:19 UTC",
    action: "PHISHING_URL_FLAGGED",
    actor: "GOOGLE_SAFE_BROWSING_V4",
    targetHandle: "@itbp_recruit_2024",
    prevHash: "e58129a0c4f83d719e20516b83f0927c89102938a1928374b91029384719283c",
    thisHash: "8b72e01a93c4d5f78219460e5b82c19a901928374b1928374c8192039481920d"
  },
  {
    id: "log-005",
    timestamp: "2026-11-16 03:10:02 UTC",
    action: "TAKEDOWN_DOCKET_CREATED",
    actor: "Cyber Analyst (Active Session)",
    targetHandle: "@itbp_recruit_2024",
    prevHash: "8b72e01a93c4d5f78219460e5b82c19a901928374b1928374c8192039481920d",
    thisHash: "1948ba5c902e4f71a8e29304b81c95e0819203948b1928374c8192039481920e"
  },
  {
    id: "log-006",
    timestamp: "2026-11-16 03:32:15 UTC",
    action: "NOTICE_SECTION_79_GENERATED",
    actor: "Nodal Cell Officer (MHA-I4C-99)",
    targetHandle: "@tactical_guard_ops",
    prevHash: "1948ba5c902e4f71a8e29304b81c95e0819203948b1928374c8192039481920e",
    thisHash: "6f901a8e3b5c4d72819204e7b81c95a2819203948b1928374c8192039481920f"
  },
  {
    id: "log-007",
    timestamp: "2026-11-16 04:02:44 UTC",
    action: "CASE_DISPATCHED_TO_META",
    actor: "Nodal Officer (ITBP)",
    targetHandle: "@itbp_recruit_2024",
    prevHash: "6f901a8e3b5c4d72819204e7b81c95a2819203948b1928374c8192039481920f",
    thisHash: "f4019283e8192c74a91029384b81920394819203948b1928374c819203948192"
  }
];
