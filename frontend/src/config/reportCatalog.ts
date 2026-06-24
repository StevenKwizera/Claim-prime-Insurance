import {
  BarChart3,
  Car,
  CheckCircle2,
  Clock,
  FileStack,
  FileText,
  HeartPulse,
  Home,
  MapPin,
  ShieldAlert,
  UserCheck,
  XCircle,
  type LucideIcon
} from "lucide-react";

export type ReportKind =
  | "portfolio"
  | "evidence"
  | "fraud"
  | "claim"
  | "approved"
  | "pending"
  | "rejected"
  | "investigation"
  | "auto"
  | "health"
  | "property"
  | "officer-workload"
  | "regional";

export type ReportCatalogEntry = {
  id: ReportKind;
  code: string;
  title: string;
  description: string;
  icon: LucideIcon;
  defaultTitle: string;
  supportsPdf: boolean;
  supportsCsv: boolean;
  needsClaimPick: boolean;
};

export const REPORT_CATALOG: ReportCatalogEntry[] = [
  {
    id: "portfolio",
    code: "RPT-01",
    title: "Monthly claims summary",
    description: "Full claims portfolio with status, risk scores, officers, and evidence counts.",
    icon: BarChart3,
    defaultTitle: "Monthly claims summary",
    supportsPdf: true,
    supportsCsv: true,
    needsClaimPick: false
  },
  {
    id: "approved",
    code: "RPT-02",
    title: "Approved claims register",
    description: "All approved claims in the selected period with assigned officers.",
    icon: CheckCircle2,
    defaultTitle: "Approved claims register",
    supportsPdf: true,
    supportsCsv: true,
    needsClaimPick: false
  },
  {
    id: "pending",
    code: "RPT-03",
    title: "Pending review queue",
    description: "Claims awaiting verification or decision — pending and under review statuses.",
    icon: Clock,
    defaultTitle: "Pending review queue",
    supportsPdf: true,
    supportsCsv: true,
    needsClaimPick: false
  },
  {
    id: "rejected",
    code: "RPT-04",
    title: "Rejected claims report",
    description: "Rejected claims with risk scores and evidence counts for quality review.",
    icon: XCircle,
    defaultTitle: "Rejected claims report",
    supportsPdf: true,
    supportsCsv: true,
    needsClaimPick: false
  },
  {
    id: "fraud",
    code: "RPT-05",
    title: "Fraud & escalation register",
    description: "High-risk and investigation claims with AI summaries for supervisor review.",
    icon: ShieldAlert,
    defaultTitle: "Fraud escalation register",
    supportsPdf: true,
    supportsCsv: true,
    needsClaimPick: false
  },
  {
    id: "investigation",
    code: "RPT-06",
    title: "Active investigations",
    description: "Claims currently in investigation status with risk scores and evidence.",
    icon: ShieldAlert,
    defaultTitle: "Active investigations report",
    supportsPdf: true,
    supportsCsv: true,
    needsClaimPick: false
  },
  {
    id: "auto",
    code: "RPT-07",
    title: "Motor (auto) claims",
    description: "All motor insurance claims in the date range — status and officers.",
    icon: Car,
    defaultTitle: "Motor auto claims report",
    supportsPdf: true,
    supportsCsv: true,
    needsClaimPick: false
  },
  {
    id: "health",
    code: "RPT-08",
    title: "Health claims",
    description: "Health insurance claims filtered by submission date.",
    icon: HeartPulse,
    defaultTitle: "Health claims report",
    supportsPdf: true,
    supportsCsv: true,
    needsClaimPick: false
  },
  {
    id: "property",
    code: "RPT-09",
    title: "Property claims",
    description: "Property and home insurance claims in the selected period.",
    icon: Home,
    defaultTitle: "Property claims report",
    supportsPdf: true,
    supportsCsv: true,
    needsClaimPick: false
  },
  {
    id: "evidence",
    code: "RPT-10",
    title: "Evidence & compliance inventory",
    description: "Every photo, video, PDF, and document with AI validation status.",
    icon: FileStack,
    defaultTitle: "Evidence and compliance inventory",
    supportsPdf: true,
    supportsCsv: true,
    needsClaimPick: false
  },
  {
    id: "officer-workload",
    code: "RPT-11",
    title: "Officer workload summary",
    description: "Claims handled per officer — counts and approvals.",
    icon: UserCheck,
    defaultTitle: "Officer workload summary",
    supportsPdf: true,
    supportsCsv: true,
    needsClaimPick: false
  },
  {
    id: "regional",
    code: "RPT-12",
    title: "Regional breakdown",
    description: "Claim volumes grouped by region.",
    icon: MapPin,
    defaultTitle: "Regional claims breakdown",
    supportsPdf: true,
    supportsCsv: true,
    needsClaimPick: false
  },
  {
    id: "claim",
    code: "RPT-13",
    title: "Single claim dossier",
    description: "One claim: summary, evidence tables, timeline, and photo previews in a branded PDF.",
    icon: FileText,
    defaultTitle: "Claim dossier report",
    supportsPdf: true,
    supportsCsv: false,
    needsClaimPick: true
  }
];

export function findReport(id: string | null | undefined): ReportCatalogEntry | undefined {
  return REPORT_CATALOG.find((entry) => entry.id === id);
}
