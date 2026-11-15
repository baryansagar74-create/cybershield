export interface DayTrend {
  day: string;
  flags: number;
  removals: number;
}

export const mock14DayTrend: DayTrend[] = [
  { day: "03 Nov", flags: 14, removals: 11 },
  { day: "04 Nov", flags: 18, removals: 15 },
  { day: "05 Nov", flags: 12, removals: 10 },
  { day: "06 Nov", flags: 22, removals: 19 },
  { day: "07 Nov", flags: 28, removals: 24 },
  { day: "08 Nov", flags: 19, removals: 18 },
  { day: "09 Nov", flags: 15, removals: 14 },
  { day: "10 Nov", flags: 25, removals: 21 },
  { day: "11 Nov", flags: 31, removals: 27 },
  { day: "12 Nov", flags: 29, removals: 26 },
  { day: "13 Nov", flags: 34, removals: 30 },
  { day: "14 Nov", flags: 27, removals: 25 },
  { day: "15 Nov", flags: 38, removals: 32 },
  { day: "16 Nov", flags: 42, removals: 36 },
];

export interface SlaDeadlineItem {
  id: string;
  caseRef: string;
  handle: string;
  platform: string;
  type: string;
  remainingMinutes: number;
  statutoryLimit: string;
}

export const mockNearestSla: SlaDeadlineItem[] = [
  {
    id: "sla-1",
    caseRef: "ITBP-PG-2026-0912",
    handle: "@itbp_recruit_2024",
    platform: "Facebook",
    type: "Emergency Govt Order (Rule 3(1)(d))",
    remainingMinutes: 28, // Under 30m -> Red gentle pulse
    statutoryLimit: "3 Hours"
  },
  {
    id: "sla-2",
    caseRef: "ITBP-PG-2026-0841",
    handle: "@officer_rajesh_8841",
    platform: "Instagram",
    type: "Urgent Complaint (Sec 79(3)(b))",
    remainingMinutes: 145, // Under 3h -> Saffron
    statutoryLimit: "36 Hours"
  },
  {
    id: "sla-3",
    caseRef: "ITBP-PG-2026-0620",
    handle: "@bsf.jawan.fan",
    platform: "X",
    type: "General Grievance (Rule 3(2))",
    remainingMinutes: 890,
    statutoryLimit: "7 Days"
  }
];
