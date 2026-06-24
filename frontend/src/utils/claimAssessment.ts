import { Claim, ClaimDocument, ClaimType } from "@/types";
import { classifyUpload, getRequiredDocuments, RequiredDocumentType } from "@/utils/documentAI";

export type RiskBand = "Low" | "Medium" | "High" | "Critical";

export type AssessmentFactor = {
  label: string;
  impact: number;
  detail: string;
};

export type ClaimAssessment = {
  fraudRiskScore: number;
  riskBand: RiskBand;
  verificationPercent: number;
  confidencePercent: number;
  completenessPercent: number;
  verificationStatus: string;
  riskLabel: string;
  flags: string[];
  factors: AssessmentFactor[];
  summary: string;
};

const TYPE_BASE_RISK: Record<ClaimType, number> = {
  auto: 5,
  health: 2,
  property: 8
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function riskBand(score: number): RiskBand {
  if (score >= 75) return "Critical";
  if (score >= 60) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function riskLabel(band: RiskBand): string {
  switch (band) {
    case "Critical":
      return "Critical — immediate fraud investigation";
    case "High":
      return "High — priority officer and fraud review";
    case "Medium":
      return "Medium — review required by officer";
    default:
      return "Low — standard processing";
  }
}

function documentTypeFor(doc: ClaimDocument): RequiredDocumentType | "Unclassified" {
  if (doc.documentType) {
    const known = getRequiredDocuments("auto")
      .concat(getRequiredDocuments("health"))
      .concat(getRequiredDocuments("property"));
    if (known.includes(doc.documentType as RequiredDocumentType)) {
      return doc.documentType as RequiredDocumentType;
    }
  }
  return classifyUpload(doc.name, doc.kind).documentType;
}

function confidenceFor(doc: ClaimDocument): number {
  if (doc.confidenceScore != null) {
    return doc.confidenceScore;
  }
  return classifyUpload(doc.name, doc.kind).confidenceScore;
}

/** Compute live AI verification + fraud assessment from claim evidence. */
export function assessClaim(claim: Pick<Claim, "type" | "status" | "documents">): ClaimAssessment {
  const required = getRequiredDocuments(claim.type);
  const factors: AssessmentFactor[] = [];
  let score = TYPE_BASE_RISK[claim.type];

  factors.push({
    label: "Claim type baseline",
    impact: TYPE_BASE_RISK[claim.type],
    detail: `${claim.type} claims carry a baseline fraud exposure.`
  });

  const matchedRequired = required.filter((req) =>
    claim.documents.some((doc) => documentTypeFor(doc) === req && doc.aiStatus !== "Missing")
  );
  const missingRequired = required.filter((req) => !matchedRequired.includes(req));
  const completenessPercent =
    required.length === 0 ? 100 : Math.round((matchedRequired.length / required.length) * 100);

  if (missingRequired.length > 0) {
    const impact = Math.min(35, missingRequired.length * 10);
    score += impact;
    factors.push({
      label: "Missing required documents",
      impact,
      detail: `Not on file: ${missingRequired.join(", ")}.`
    });
  }

  const flagged = claim.documents.filter((doc) => doc.aiStatus === "Flagged");
  if (flagged.length > 0) {
    const impact = Math.min(35, flagged.length * 14);
    score += impact;
    factors.push({
      label: "Flagged evidence",
      impact,
      detail: `${flagged.length} file(s) failed consistency or authenticity checks.`
    });
  }

  const confidences = claim.documents.map(confidenceFor);
  const confidencePercent =
    confidences.length === 0 ? 0 : Math.round(confidences.reduce((sum, c) => sum + c, 0) / confidences.length);

  if (confidences.length > 0 && confidencePercent < 80) {
    const impact = Math.round((80 - confidencePercent) * 0.45);
    if (impact > 0) {
      score += impact;
      factors.push({
        label: "Low AI document confidence",
        impact,
        detail: `Average OCR/classification confidence is ${confidencePercent}%.`
      });
    }
  }

  const flaggedReceipts = flagged.filter((doc) => /receipt|invoice|estimate|pharmacy/i.test(doc.name));
  if (flaggedReceipts.length >= 2) {
    score += 8;
    factors.push({
      label: "Duplicate invoice signals",
      impact: 8,
      detail: "Multiple cost documents flagged — possible duplicate or inconsistent invoices."
    });
  }

  if (claim.status === "Investigation") {
    const before = score;
    score = Math.max(score, 72);
    if (score > before) {
      factors.push({
        label: "Active investigation",
        impact: score - before,
        detail: "Claim is under formal fraud investigation."
      });
    }
  }

  const fraudRiskScore = clamp(Math.round(score), 0, 100);
  const band = riskBand(fraudRiskScore);

  const verificationPercent = clamp(
    Math.round(completenessPercent * 0.55 + confidencePercent * 0.45),
    0,
    100
  );

  const flags: string[] = [];
  if (missingRequired.length) flags.push(`${missingRequired.length} required document(s) missing`);
  if (flagged.length) flags.push(`${flagged.length} evidence file(s) flagged`);
  if (confidencePercent > 0 && confidencePercent < 75) flags.push("Low average document confidence");
  if (fraudRiskScore >= 60) flags.push("Elevated fraud indicators");

  let verificationStatus: string;
  if (missingRequired.length > 0) {
    verificationStatus = "Incomplete — required documents missing";
  } else if (fraudRiskScore >= 75) {
    verificationStatus = "Failed auto-verification — fraud review required";
  } else if (flagged.length > 0 || fraudRiskScore >= 40) {
    verificationStatus = "Needs officer review";
  } else {
    verificationStatus = "AI verified — ready for officer sign-off";
  }

  const summaryParts: string[] = [
    `Document compliance: ${completenessPercent}% (${matchedRequired.length}/${required.length} required types).`,
    `AI confidence: ${confidencePercent}% across ${claim.documents.length} file(s).`
  ];
  if (flagged.length) {
    summaryParts.push(
      `${flagged.length} document(s) flagged: ${flagged.map((d) => d.name).slice(0, 3).join("; ")}${flagged.length > 3 ? "…" : ""}.`
    );
  }
  summaryParts.push(`Fraud risk: ${band} (${fraudRiskScore}/100). ${riskLabel(band)}.`);

  return {
    fraudRiskScore,
    riskBand: band,
    verificationPercent,
    confidencePercent,
    completenessPercent,
    verificationStatus,
    riskLabel: riskLabel(band),
    flags,
    factors,
    summary: summaryParts.join(" ")
  };
}

/** Sync stored claim fields with a fresh assessment (for mock submit / display helpers). */
export function applyAssessmentToClaim<T extends Claim>(claim: T): T {
  const assessment = assessClaim(claim);
  return {
    ...claim,
    riskScore: assessment.fraudRiskScore,
    aiSummary: assessment.summary
  };
}
