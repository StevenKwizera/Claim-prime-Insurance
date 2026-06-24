import { ReportKind } from "@/config/reportCatalog";
import { Claim } from "@/types";

export function formatPeriodLabel(from: string, to: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(from)} – ${fmt(to)}`;
}

export function getDefaultDateRange(claims: Claim[]): { from: string; to: string } {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);

  if (!claims.length) {
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 90);
    return { from: fromDate.toISOString().slice(0, 10), to };
  }

  const times = claims
    .map((claim) => new Date(claim.submittedAt).getTime())
    .filter((value) => !Number.isNaN(value));

  if (!times.length) {
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 90);
    return { from: fromDate.toISOString().slice(0, 10), to };
  }

  const earliest = new Date(Math.min(...times));
  return { from: earliest.toISOString().slice(0, 10), to };
}

export function filterClaimsByDateRange(claims: Claim[], from: string, to: string): Claim[] {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  return claims.filter((claim) => {
    const submitted = new Date(claim.submittedAt);
    return submitted >= start && submitted <= end;
  });
}

export function filterClaimsForReport(claims: Claim[], kind: ReportKind): Claim[] {
  switch (kind) {
    case "portfolio":
    case "evidence":
    case "officer-workload":
    case "regional":
      return claims;
    case "fraud":
      return claims.filter((claim) => claim.riskScore >= 50 || claim.status === "Investigation");
    case "approved":
      return claims.filter((claim) => claim.status === "Approved");
    case "pending":
      return claims.filter((claim) => claim.status === "Pending" || claim.status === "Under Review");
    case "rejected":
      return claims.filter((claim) => claim.status === "Rejected");
    case "investigation":
      return claims.filter((claim) => claim.status === "Investigation");
    case "auto":
      return claims.filter((claim) => claim.type === "auto");
    case "health":
      return claims.filter((claim) => claim.type === "health");
    case "property":
      return claims.filter((claim) => claim.type === "property");
    case "claim":
      return claims;
    default:
      return claims;
  }
}

export function resolveReportClaims(
  allClaims: Claim[],
  kind: ReportKind,
  from: string,
  to: string
): Claim[] {
  const inRange = filterClaimsByDateRange(allClaims, from, to);
  return filterClaimsForReport(inRange, kind);
}

type CsvRow = Record<string, string | number>;

export function buildReportCsvRows(claims: Claim[], kind: ReportKind): CsvRow[] {
  if (kind === "evidence") {
    return claims.flatMap((claim) =>
      claim.documents.map((doc) => ({
        claimId: claim.id,
        claimantName: claim.claimantName,
        fileName: doc.name,
        kind: doc.kind,
        aiStatus: doc.aiStatus,
        uploadedAt: doc.uploadedAt
      }))
    );
  }

  if (kind === "fraud") {
    return claims.map((claim) => ({
      claimId: claim.id,
      claimantName: claim.claimantName,
      status: claim.status,
      riskScore: claim.riskScore,
      evidenceFiles: claim.documents.length,
      aiSummary: claim.aiSummary,
      submittedAt: claim.submittedAt
    }));
  }

  if (kind === "officer-workload") {
    const byOfficer = new Map<string, { count: number; approved: number }>();
    claims.forEach((claim) => {
      const officer = claim.assignedOfficer || "Unassigned";
      const current = byOfficer.get(officer) ?? { count: 0, approved: 0 };
      current.count += 1;
      if (claim.status === "Approved") {
        current.approved += 1;
      }
      byOfficer.set(officer, current);
    });
    return Array.from(byOfficer.entries()).map(([officer, stats]) => ({
      officer,
      claimsHandled: stats.count,
      approvedClaims: stats.approved
    }));
  }

  if (kind === "regional") {
    const byRegion = new Map<string, { count: number }>();
    claims.forEach((claim) => {
      const current = byRegion.get(claim.region) ?? { count: 0 };
      current.count += 1;
      byRegion.set(claim.region, current);
    });
    return Array.from(byRegion.entries()).map(([region, stats]) => ({
      region,
      claimCount: stats.count
    }));
  }

  return claims.map((claim) => ({
    claimId: claim.id,
    claimantName: claim.claimantName,
    policyNumber: claim.policyNumber,
    type: claim.type,
    status: claim.status,
    region: claim.region,
    riskScore: claim.riskScore,
    evidenceFiles: claim.documents.length,
    assignedOfficer: claim.assignedOfficer,
    submittedAt: claim.submittedAt
  }));
}

export type ReportPreviewTable = {
  headers: string[];
  rows: string[][];
  rowCount: number;
  summary: string;
};

export function buildReportPreviewTable(claims: Claim[], kind: ReportKind, periodLabel: string): ReportPreviewTable {
  if (kind === "evidence") {
    const rows = claims.flatMap((claim) =>
      claim.documents.slice(0, 3).map((doc) => [
        claim.id,
        claim.claimantName,
        doc.name,
        doc.aiStatus,
        new Date(doc.uploadedAt).toLocaleDateString("en-GB")
      ])
    );
    const totalDocs = claims.reduce((sum, claim) => sum + claim.documents.length, 0);
    return {
      headers: ["Claim ID", "Claimant", "File", "AI status", "Uploaded"],
      rows: rows.slice(0, 25),
      rowCount: totalDocs,
      summary: `${totalDocs} evidence files across ${claims.length} claims · ${periodLabel}`
    };
  }

  if (kind === "officer-workload") {
    const csvRows = buildReportCsvRows(claims, kind);
    return {
      headers: ["Officer", "Claims", "Approved"],
      rows: csvRows.map((row) => [
        String(row.officer),
        String(row.claimsHandled),
        String(row.approvedClaims)
      ]),
      rowCount: csvRows.length,
      summary: `${csvRows.length} officers · ${claims.length} claims in period · ${periodLabel}`
    };
  }

  if (kind === "regional") {
    const csvRows = buildReportCsvRows(claims, kind);
    return {
      headers: ["Region", "Claims"],
      rows: csvRows.map((row) => [String(row.region), String(row.claimCount)]),
      rowCount: csvRows.length,
      summary: `${claims.length} claims across ${csvRows.length} regions · ${periodLabel}`
    };
  }

  const previewClaims = claims.slice(0, 25);
  return {
    headers: ["Claim ID", "Claimant", "Type", "Status", "Submitted"],
    rows: previewClaims.map((claim) => [
      claim.id,
      claim.claimantName,
      claim.type,
      claim.status,
      new Date(claim.submittedAt).toLocaleDateString("en-GB")
    ]),
    rowCount: claims.length,
    summary: `${claims.length} claims in selected period · ${periodLabel}`
  };
}

export function reportFilename(kind: ReportKind, format: "pdf" | "csv"): string {
  const date = new Date().toISOString().slice(0, 10);
  const names: Record<ReportKind, string> = {
    portfolio: "claims-portfolio",
    fraud: "fraud-escalation",
    evidence: "evidence-inventory",
    claim: "claim-dossier",
    approved: "approved-claims",
    pending: "pending-queue",
    rejected: "rejected-claims",
    investigation: "investigation-register",
    auto: "motor-auto-claims",
    health: "health-claims",
    property: "property-claims",
    "officer-workload": "officer-workload",
    regional: "regional-summary"
  };
  return `prime-${names[kind]}-${date}.${format}`;
}
