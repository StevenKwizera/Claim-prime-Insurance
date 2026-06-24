import { jsPDF } from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";
import primeLogoJpeg from "@/logo prime.jpeg";
import { Claim } from "@/types";
import { isImageDocument, isPdfDocument, isVideoDocument } from "@/utils/claimAccess";

export type ReportMeta = {
  title: string;
  subtitle?: string;
  generatedBy: string;
  generatedByRole?: string;
  /** Fixed timestamp for header, footer, and signature (set when export starts). */
  generatedAt?: Date;
};

/** Balanced green-first report palette (reduced blue dominance). */
const BRAND_BLUE: [number, number, number] = [74, 111, 160];
const BRAND_BLUE_DARK: [number, number, number] = [45, 72, 116];
const BRAND_HEADER_TEXT_SOFT: [number, number, number] = [226, 232, 240];
/** Prime green accent */
const BRAND_GREEN: [number, number, number] = [6, 122, 99];
const BRAND_GREEN_DARK: [number, number, number] = [4, 99, 78];
const BRAND_GREEN_LIGHT: [number, number, number] = [236, 253, 245];
const BRAND_GREEN_MID: [number, number, number] = [167, 243, 208];

const MARGIN = 14;
const HEADER_HEIGHT = 50;
const LOGO_MAX_W = 58;
const LOGO_MAX_H = 28;
const SIGNATURE_TOP_OFFSET = 50;
const FOOTER_Y = 10;

type LogoData = { dataUrl: string; aspect: number };

let logoCache: LogoData | null | undefined;

function formatRoleLabel(role?: string) {
  if (!role) {
    return "Staff";
  }
  const labels: Record<string, string> = {
    officer: "Claims Officer",
    supervisor: "Claims Supervisor",
    admin: "Administrator",
    claimant: "Claimant"
  };
  return labels[role.toLowerCase()] ?? role;
}

function reportTimestamp(meta: ReportMeta) {
  return meta.generatedAt ?? new Date();
}

function formatReportDate(meta: ReportMeta) {
  return reportTimestamp(meta).toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function loadPrimeLogo(): Promise<LogoData | null> {
  if (logoCache !== undefined) {
    return logoCache;
  }
  try {
    const image = new Image();
    image.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Logo load failed"));
      image.src = primeLogoJpeg;
    });
    const maxW = 480;
    const scale = maxW / image.width;
    const width = maxW;
    const height = Math.round(image.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      logoCache = null;
      return null;
    }
    ctx.drawImage(image, 0, 0, width, height);
    logoCache = {
      dataUrl: canvas.toDataURL("image/jpeg", 0.92),
      aspect: width / height
    };
    return logoCache;
  } catch {
    logoCache = null;
    return null;
  }
}

function logoDisplaySize(aspect: number) {
  let w = LOGO_MAX_W;
  let h = w / aspect;
  if (h > LOGO_MAX_H) {
    h = LOGO_MAX_H;
    w = h * aspect;
  }
  return { w, h };
}

function brandedTableOptions(overrides: UserOptions = {}): UserOptions {
  return {
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [191, 219, 254],
      lineWidth: 0.1,
      ...overrides.styles
    },
    headStyles: {
      fillColor: BRAND_GREEN_DARK,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      ...overrides.headStyles
    },
    alternateRowStyles: {
      fillColor: BRAND_GREEN_LIGHT,
      ...overrides.alternateRowStyles
    },
    margin: { left: MARGIN, right: MARGIN, bottom: SIGNATURE_TOP_OFFSET + 6 },
    ...overrides
  };
}

async function drawReportHeader(doc: jsPDF, meta: ReportMeta) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const bandH = HEADER_HEIGHT - 5;

  doc.setFillColor(...BRAND_GREEN_DARK);
  doc.rect(0, 0, pageWidth, bandH, "F");

  doc.setFillColor(...BRAND_BLUE_DARK);
  doc.rect(0, bandH - 14, pageWidth, 14, "F");

  doc.setFillColor(...BRAND_GREEN_MID);
  doc.rect(0, HEADER_HEIGHT - 5, pageWidth, 3, "F");

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.15);
  doc.line(MARGIN, HEADER_HEIGHT - 5.5, pageWidth - MARGIN, HEADER_HEIGHT - 5.5);

  const logo = await loadPrimeLogo();
  const logoX = MARGIN;
  const logoY = 9;

  if (logo) {
    const { w, h } = logoDisplaySize(logo.aspect);
    const pad = 2;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(logoX, logoY, w + pad * 2, h + pad * 2, 2, 2, "F");
    doc.addImage(logo.dataUrl, "JPEG", logoX + pad, logoY + pad, w, h);
  } else {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(logoX, logoY, LOGO_MAX_W, LOGO_MAX_H, 2, 2, "F");
    doc.setTextColor(...BRAND_BLUE_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("PRIME", logoX + 6, logoY + 12);
    doc.setTextColor(...BRAND_GREEN);
    doc.text("INSURANCE", logoX + 6, logoY + 20);
  }

  const textX = logoX + LOGO_MAX_W + 10;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Prime Insurance", textX, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_GREEN_MID);
  doc.text("Digital Claims Portal · Rwanda", textX, 20);
  doc.setTextColor(...BRAND_HEADER_TEXT_SOFT);
  doc.text("Official internal report", textX, 26);

  const titleX = pageWidth * 0.42;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const titleLines = doc.splitTextToSize(meta.title, pageWidth - titleX - MARGIN);
  doc.text(titleLines, titleX, 14);
  if (meta.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_HEADER_TEXT_SOFT);
    const subLines = doc.splitTextToSize(meta.subtitle, pageWidth - titleX - MARGIN);
    const subY = 14 + titleLines.length * 5 + 2;
    doc.text(subLines, titleX, subY);
  }

  const generatedAt = formatReportDate(meta);
  const roleLabel = formatRoleLabel(meta.generatedByRole);
  const rightX = pageWidth - MARGIN;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_HEADER_TEXT_SOFT);
  doc.text(`Report date: ${generatedAt}`, rightX, 12, { align: "right" });
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(`Prepared by: ${meta.generatedBy}`, rightX, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND_GREEN_MID);
  doc.text(roleLabel, rightX, 24, { align: "right" });
  doc.setTextColor(167, 243, 208);
  doc.setFontSize(7);
  doc.text("Confidential — Prime Insurance", rightX, 30, { align: "right" });

  doc.setTextColor(30, 41, 59);
}

function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(MARGIN, y - 4, 3, 8, "F");
  doc.setTextColor(...BRAND_BLUE_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, MARGIN + 6, y);
  doc.setFont("helvetica", "normal");
}

function drawReportSignature(doc: jsPDF, meta: ReportMeta, topY: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxW = pageWidth - MARGIN * 2;
  const boxH = 36;
  const roleLabel = formatRoleLabel(meta.generatedByRole);
  const dateStr = formatReportDate(meta);

  doc.setDrawColor(...BRAND_BLUE);
  doc.setLineWidth(0.3);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(MARGIN, topY, boxW, boxH, 2, 2, "FD");

  doc.setFillColor(...BRAND_GREEN);
  doc.rect(MARGIN, topY, boxW, 3, "F");

  doc.setTextColor(...BRAND_BLUE_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Certification & signature", MARGIN + 4, topY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "I certify that the information in this report was prepared from system records at the time of export.",
    MARGIN + 4,
    topY + 14,
    { maxWidth: boxW - 8 }
  );

  const sigLineY = topY + 26;
  const sigX = MARGIN + 4;
  const sigLineW = 72;

  doc.setDrawColor(...BRAND_GREEN);
  doc.setLineWidth(0.5);
  doc.line(sigX, sigLineY, sigX + sigLineW, sigLineY);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND_BLUE_DARK);
  const sigName = meta.generatedBy.length > 28 ? `${meta.generatedBy.slice(0, 26)}…` : meta.generatedBy;
  doc.text(sigName, sigX, sigLineY - 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(meta.generatedBy, sigX, sigLineY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...BRAND_GREEN);
  doc.text(`${roleLabel} · Prime Insurance`, sigX, sigLineY + 10);

  doc.setTextColor(71, 85, 105);
  doc.text("Signed electronically", sigX, sigLineY + 15);

  const rightColX = pageWidth - MARGIN - 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text("Date of issue", rightColX, topY + 20, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_BLUE_DARK);
  doc.text(dateStr, rightColX, topY + 25, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Prime Insurance — Claims Division", rightColX, topY + 31, { align: "right" });
}

function getLastTableY(doc: jsPDF) {
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
}

function finalizeReport(doc: jsPDF, meta: ReportMeta, contentEndY?: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const signatureTop = pageHeight - SIGNATURE_TOP_OFFSET;
  const lastY = contentEndY ?? getLastTableY(doc) ?? HEADER_HEIGHT + 20;

  doc.setPage(doc.getNumberOfPages());
  if (lastY > signatureTop - 10) {
    doc.addPage();
  }

  drawReportSignature(doc, meta, signatureTop);
  addPageFooters(doc, meta);
}

function addPageFooters(doc: jsPDF, meta: ReportMeta) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dateStr = formatReportDate(meta);

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    const footerLineY = pageHeight - FOOTER_Y;
    doc.setFillColor(...BRAND_BLUE);
    doc.rect(MARGIN, footerLineY - 5, pageWidth - MARGIN * 2, 0.6, "F");
    doc.setFillColor(...BRAND_GREEN);
    doc.rect(MARGIN, footerLineY - 5, 28, 0.6, "F");
    doc.setFontSize(7);
    doc.setTextColor(...BRAND_BLUE_DARK);
    doc.text(`${meta.title} · ${meta.generatedBy} · ${dateStr}`, MARGIN, footerLineY);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - MARGIN, footerLineY, { align: "right" });
  }
}

export type PdfExportOptions = { download?: boolean };

function deliverPdf(doc: jsPDF, filename: string, options?: PdfExportOptions): Blob {
  const blob = doc.output("blob") as Blob;
  if (options?.download !== false) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2500);
  }
  return blob;
}

export async function generateClaimsPortfolioPdf(
  claims: Claim[],
  meta: ReportMeta,
  options?: PdfExportOptions
): Promise<Blob> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  await drawReportHeader(doc, {
    ...meta,
    subtitle: meta.subtitle ?? `${claims.length} claims in portfolio`
  });

  const approved = claims.filter((c) => c.status === "Approved").length;
  const underReview = claims.filter((c) => c.status === "Under Review").length;
  const investigation = claims.filter((c) => c.status === "Investigation").length;
  const totalEvidence = claims.reduce((sum, c) => sum + c.documents.length, 0);

  drawSectionTitle(doc, "Portfolio summary", HEADER_HEIGHT + 8);

  autoTable(
    doc,
    brandedTableOptions({
      startY: HEADER_HEIGHT + 12,
      head: [["Metric", "Value"]],
      body: [
        ["Total claims", String(claims.length)],
        ["Approved", String(approved)],
        ["Under review", String(underReview)],
        ["Investigation", String(investigation)],
        ["Evidence files (all claims)", String(totalEvidence)]
      ],
      styles: { fontSize: 9 }
    })
  );

  const tableEnd = getLastTableY(doc) ?? HEADER_HEIGHT + 40;

  drawSectionTitle(doc, "Claims detail", tableEnd + 10);

  autoTable(
    doc,
    brandedTableOptions({
      startY: tableEnd + 14,
      head: [["Claim ID", "Claimant", "Type", "Status", "Region", "Risk", "Evidence", "Officer"]],
      body: claims.map((claim) => [
        claim.id,
        claim.claimantName,
        claim.type,
        claim.status,
        claim.region,
        String(claim.riskScore),
        String(claim.documents.length),
        claim.assignedOfficer
      ]),
      styles: { fontSize: 7, cellPadding: 2 }
    })
  );

  finalizeReport(doc, meta);
  return deliverPdf(doc, `prime-claims-portfolio-${new Date().toISOString().slice(0, 10)}.pdf`, options);
}

export async function generateEvidenceInventoryPdf(
  claims: Claim[],
  meta: ReportMeta,
  options?: PdfExportOptions
): Promise<Blob> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  await drawReportHeader(doc, {
    ...meta,
    subtitle: meta.subtitle ?? "Photos, videos, PDFs, and documents across claims"
  });

  drawSectionTitle(doc, "Evidence inventory", HEADER_HEIGHT + 8);

  const rows = claims.flatMap((claim) =>
    claim.documents.map((docItem) => {
      const kind = isImageDocument(docItem)
        ? "Photo"
        : isVideoDocument(docItem)
          ? "Video"
          : isPdfDocument(docItem)
            ? "PDF"
            : "Document";
      return [
        claim.id,
        claim.claimantName,
        docItem.name,
        kind,
        docItem.aiStatus,
        docItem.tag,
        new Date(docItem.uploadedAt).toLocaleDateString("en-GB")
      ];
    })
  );

  autoTable(
    doc,
    brandedTableOptions({
      startY: HEADER_HEIGHT + 12,
      head: [["Claim ID", "Claimant", "File name", "Type", "AI status", "Tag", "Uploaded"]],
      body: rows.length ? rows : [["—", "—", "No evidence files in system", "—", "—", "—", "—"]],
      styles: { fontSize: 7, cellPadding: 2 }
    })
  );

  finalizeReport(doc, meta);
  return deliverPdf(doc, `prime-evidence-inventory-${new Date().toISOString().slice(0, 10)}.pdf`, options);
}

export async function generateClaimDossierPdf(
  claim: Claim,
  meta: ReportMeta,
  options?: PdfExportOptions
): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await drawReportHeader(doc, {
    ...meta,
    subtitle: meta.subtitle ?? `Claim ${claim.id} · ${claim.claimantName}`
  });

  let y = HEADER_HEIGHT + 8;
  drawSectionTitle(doc, "Claim summary", y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const summaryLines = [
    `Policy: ${claim.policyNumber}`,
    `Type: ${claim.type} · Status: ${claim.status} · Region: ${claim.region}`,
    `Risk score: ${claim.riskScore}`,
    `Submitted: ${new Date(claim.submittedAt).toLocaleString("en-GB")}`,
    `Assigned: ${claim.assignedOfficer} (${claim.assignedTeam})`,
    `AI summary: ${claim.aiSummary}`
  ];
  summaryLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, doc.internal.pageSize.getWidth() - MARGIN * 2);
    doc.text(wrapped, MARGIN, y);
    y += wrapped.length * 4.5;
  });

  const photos = claim.documents.filter((d) => isImageDocument(d));
  const videos = claim.documents.filter((d) => isVideoDocument(d));
  const pdfs = claim.documents.filter((d) => isPdfDocument(d));
  const other = claim.documents.filter(
    (d) => !isImageDocument(d) && !isVideoDocument(d) && !isPdfDocument(d)
  );

  autoTable(
    doc,
    brandedTableOptions({
      startY: y + 4,
      head: [["Evidence type", "Count"]],
      body: [
        ["Photos", String(photos.length)],
        ["Videos", String(videos.length)],
        ["PDFs", String(pdfs.length)],
        ["Other documents", String(other.length)],
        ["Total files", String(claim.documents.length)]
      ],
      styles: { fontSize: 9 }
    })
  );

  const tableEnd = getLastTableY(doc) ?? y + 30;

  drawSectionTitle(doc, "All evidence files", tableEnd + 8);

  autoTable(
    doc,
    brandedTableOptions({
      startY: tableEnd + 12,
      head: [["File name", "Type", "AI status", "Uploaded", "Tag"]],
      body: claim.documents.map((docItem) => {
        const kind = isImageDocument(docItem)
          ? "Photo"
          : isVideoDocument(docItem)
            ? "Video"
            : isPdfDocument(docItem)
              ? "PDF"
              : "Document";
        return [
          docItem.name,
          kind,
          docItem.aiStatus,
          new Date(docItem.uploadedAt).toLocaleDateString("en-GB"),
          docItem.tag
        ];
      }),
      styles: { fontSize: 8 }
    })
  );

  const evidenceEnd = getLastTableY(doc) ?? tableEnd + 40;
  let imageY = evidenceEnd + 10;

  if (photos.length > 0) {
    drawSectionTitle(doc, "Photo evidence (preview)", imageY);
    imageY += 8;

    for (const photo of photos.slice(0, 6)) {
      const url = photo.previewUrl;
      if (!url) {
        continue;
      }
      try {
        const dataUrl = await fetchImageAsJpegDataUrl(url);
        if (!dataUrl) {
          continue;
        }
        const pageHeight = doc.internal.pageSize.getHeight();
        if (imageY > pageHeight - SIGNATURE_TOP_OFFSET - 20) {
          doc.addPage();
          imageY = MARGIN + 10;
        }
        doc.setDrawColor(...BRAND_BLUE);
        doc.setLineWidth(0.4);
        const w = 55;
        const h = 38;
        doc.roundedRect(MARGIN - 0.5, imageY - 0.5, w + 1, h + 1, 2, 2, "S");
        doc.addImage(dataUrl, "JPEG", MARGIN, imageY, w, h);
        doc.setFontSize(7);
        doc.setTextColor(...BRAND_GREEN);
        doc.text(photo.name.slice(0, 40), MARGIN, imageY + h + 4);
        imageY += h + 12;
      } catch {
        /* skip broken preview */
      }
    }
  }

  drawSectionTitle(doc, "Claim timeline", imageY + 2);

  autoTable(
    doc,
    brandedTableOptions({
      startY: imageY + 6,
      head: [["Timeline", "Actor", "Date"]],
      body: claim.timeline.map((entry) => [entry.label, entry.actor, new Date(entry.at).toLocaleString("en-GB")]),
      styles: { fontSize: 8 }
    })
  );

  finalizeReport(doc, meta, getLastTableY(doc) ?? imageY);
  return deliverPdf(doc, `prime-claim-${claim.id}-${new Date().toISOString().slice(0, 10)}.pdf`, options);
}

async function fetchImageAsJpegDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject();
      image.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(objectUrl);
      return null;
    }
    ctx.drawImage(image, 0, 0);
    URL.revokeObjectURL(objectUrl);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}

export async function generateFraudEscalationPdf(
  claims: Claim[],
  meta: ReportMeta,
  options?: PdfExportOptions
): Promise<Blob> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  await drawReportHeader(doc, {
    ...meta,
    subtitle: meta.subtitle ?? `${claims.length} high-risk / investigation claims`
  });

  drawSectionTitle(doc, "Fraud & escalation register", HEADER_HEIGHT + 8);

  autoTable(
    doc,
    brandedTableOptions({
      startY: HEADER_HEIGHT + 12,
      head: [["Claim ID", "Claimant", "Status", "Risk", "Region", "Evidence", "Summary"]],
      body: claims.length
        ? claims.map((claim) => [
            claim.id,
            claim.claimantName,
            claim.status,
            String(claim.riskScore),
            claim.region,
            String(claim.documents.length),
            claim.aiSummary.slice(0, 120)
          ])
        : [["—", "No matching claims in period", "—", "—", "—", "—", "—"]],
      styles: { fontSize: 7, cellPadding: 2 }
    })
  );

  finalizeReport(doc, meta);
  return deliverPdf(doc, `prime-fraud-escalation-${new Date().toISOString().slice(0, 10)}.pdf`, options);
}

export async function generateClaimsListPdf(
  claims: Claim[],
  meta: ReportMeta,
  options?: PdfExportOptions & { sectionTitle?: string }
): Promise<Blob> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  await drawReportHeader(doc, {
    ...meta,
    subtitle: meta.subtitle ?? `${claims.length} claims in selected period`
  });

  const sectionTitle = options?.sectionTitle ?? "Claims detail";
  drawSectionTitle(doc, sectionTitle, HEADER_HEIGHT + 8);

  autoTable(
    doc,
    brandedTableOptions({
      startY: HEADER_HEIGHT + 12,
      head: [["Claim ID", "Claimant", "Type", "Status", "Region", "Risk", "Officer", "Submitted"]],
      body: claims.length
        ? claims.map((claim) => [
            claim.id,
            claim.claimantName,
            claim.type,
            claim.status,
            claim.region,
            String(claim.riskScore),
            claim.assignedOfficer,
            new Date(claim.submittedAt).toLocaleDateString("en-GB")
          ])
        : [["—", "No matching claims in period", "—", "—", "—", "—", "—", "—"]],
      styles: { fontSize: 7, cellPadding: 2 }
    })
  );

  finalizeReport(doc, meta);
  const slug = meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  return deliverPdf(doc, `prime-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`, options);
}

export async function generateOfficerWorkloadPdf(
  claims: Claim[],
  meta: ReportMeta,
  options?: PdfExportOptions
): Promise<Blob> {
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

  const rows = Array.from(byOfficer.entries()).map(([officer, stats]) => [
    officer,
    String(stats.count),
    String(stats.approved)
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  await drawReportHeader(doc, {
    ...meta,
    subtitle: meta.subtitle ?? `${byOfficer.size} officers · ${claims.length} claims`
  });

  drawSectionTitle(doc, "Officer workload summary", HEADER_HEIGHT + 8);

  autoTable(
    doc,
    brandedTableOptions({
      startY: HEADER_HEIGHT + 12,
      head: [["Officer", "Claims handled", "Approved"]],
      body: rows.length ? rows : [["—", "No claims in period", "—"]],
      styles: { fontSize: 8 }
    })
  );

  finalizeReport(doc, meta);
  return deliverPdf(doc, `prime-officer-workload-${new Date().toISOString().slice(0, 10)}.pdf`, options);
}

export async function generateRegionalSummaryPdf(
  claims: Claim[],
  meta: ReportMeta,
  options?: PdfExportOptions
): Promise<Blob> {
  const byRegion = new Map<string, { count: number }>();
  claims.forEach((claim) => {
    const current = byRegion.get(claim.region) ?? { count: 0 };
    current.count += 1;
    byRegion.set(claim.region, current);
  });

  const rows = Array.from(byRegion.entries()).map(([region, stats]) => [region, String(stats.count)]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  await drawReportHeader(doc, {
    ...meta,
    subtitle: meta.subtitle ?? `${byRegion.size} regions · ${claims.length} claims`
  });

  drawSectionTitle(doc, "Regional breakdown", HEADER_HEIGHT + 8);

  autoTable(
    doc,
    brandedTableOptions({
      startY: HEADER_HEIGHT + 12,
      head: [["Region", "Claim count"]],
      body: rows.length ? rows : [["—", "No claims in period"]],
      styles: { fontSize: 8 }
    })
  );

  finalizeReport(doc, meta);
  return deliverPdf(doc, `prime-regional-summary-${new Date().toISOString().slice(0, 10)}.pdf`, options);
}
