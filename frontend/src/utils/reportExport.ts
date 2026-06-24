import { ReportKind } from "@/config/reportCatalog";
import { Claim } from "@/types";
import { downloadTextFile, toCsv } from "@/utils/download";
import {
  generateClaimDossierPdf,
  generateClaimsListPdf,
  generateClaimsPortfolioPdf,
  generateEvidenceInventoryPdf,
  generateFraudEscalationPdf,
  generateOfficerWorkloadPdf,
  generateRegionalSummaryPdf,
  ReportMeta
} from "@/utils/pdfReport";
import { buildReportCsvRows, formatPeriodLabel, reportFilename, resolveReportClaims } from "@/utils/reportData";

export type ReportBuildInput = {
  kind: ReportKind;
  allClaims: Claim[];
  dateFrom: string;
  dateTo: string;
  claimId?: string;
  meta: ReportMeta;
};

function periodSubtitle(from: string, to: string, count: number): string {
  return `Period: ${formatPeriodLabel(from, to)} · ${count} record${count === 1 ? "" : "s"}`;
}

export async function buildReportPdfBlob(input: ReportBuildInput): Promise<Blob> {
  const { kind, allClaims, dateFrom, dateTo, claimId, meta } = input;
  const claims = resolveReportClaims(allClaims, kind, dateFrom, dateTo);
  const subtitle = periodSubtitle(dateFrom, dateTo, kind === "claim" ? 1 : claims.length);
  const enrichedMeta = { ...meta, subtitle };

  switch (kind) {
    case "portfolio":
      return generateClaimsPortfolioPdf(claims, enrichedMeta, { download: false });
    case "fraud":
      return generateFraudEscalationPdf(claims, enrichedMeta, { download: false });
    case "evidence":
      return generateEvidenceInventoryPdf(claims, enrichedMeta, { download: false });
    case "officer-workload":
      return generateOfficerWorkloadPdf(claims, enrichedMeta, { download: false });
    case "regional":
      return generateRegionalSummaryPdf(claims, enrichedMeta, { download: false });
    case "claim": {
      const claim = allClaims.find((item) => item.id === claimId);
      if (!claim) {
        throw new Error("Select a claim for the single-claim dossier report.");
      }
      return generateClaimDossierPdf(claim, {
        ...enrichedMeta,
        subtitle: `Claim dossier · ${claim.id} · ${formatPeriodLabel(dateFrom, dateTo)}`
      }, { download: false });
    }
    default:
      return generateClaimsListPdf(claims, enrichedMeta, {
        download: false,
        sectionTitle: meta.title
      });
  }
}

export async function downloadReportPdf(input: ReportBuildInput): Promise<void> {
  const blob = await buildReportPdfBlob(input);
  const filename = reportFilename(input.kind, "pdf");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
}

export function buildReportCsvContent(input: ReportBuildInput): string {
  const claims = resolveReportClaims(input.allClaims, input.kind, input.dateFrom, input.dateTo);
  const rows = buildReportCsvRows(claims, input.kind);
  return toCsv(rows);
}

export function downloadReportCsv(input: ReportBuildInput): void {
  const content = buildReportCsvContent(input);
  downloadTextFile(reportFilename(input.kind, "csv"), content, "text/csv;charset=utf-8");
}
