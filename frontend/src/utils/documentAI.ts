import { ClaimDocument, ClaimType, EvidenceKind } from "@/types";

export type RequiredDocumentType =
  | "ID Document"
  | "Police Report"
  | "Medical Report"
  | "Invoice"
  | "Photos"
  | "Witness Statement"
  | "Damage Report"
  | "Property Ownership";

export interface ClassifiedUpload {
  name: string;
  kind: EvidenceKind;
  documentType: RequiredDocumentType | "Unclassified";
  aiStatus: ClaimDocument["aiStatus"];
  confidenceScore: number;
  reviewNote: string;
}

export function detectFileKind(file: File): EvidenceKind {
  const name = file.name.toLowerCase();
  if (file.type.includes("pdf") || name.endsWith(".pdf")) {
    return "pdf";
  }
  if (file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/.test(name)) {
    return "video";
  }
  if (file.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|bmp)$/.test(name)) {
    return "image";
  }
  return "document";
}

const requirementsByClaimType: Record<ClaimType, RequiredDocumentType[]> = {
  auto: ["ID Document", "Police Report", "Invoice", "Photos", "Damage Report"],
  health: ["ID Document", "Medical Report", "Invoice"],
  property: ["ID Document", "Property Ownership", "Photos", "Damage Report", "Invoice"]
};

const classifyByName = (fileName: string): RequiredDocumentType | "Unclassified" => {
  const normalized = fileName.toLowerCase();

  if (normalized.includes("id") || normalized.includes("national") || normalized.includes("passport")) {
    return "ID Document";
  }
  if (normalized.includes("police")) {
    return "Police Report";
  }
  if (normalized.includes("medical") || normalized.includes("hospital") || normalized.includes("discharge")) {
    return "Medical Report";
  }
  if (normalized.includes("invoice") || normalized.includes("receipt") || normalized.includes("bill")) {
    return "Invoice";
  }
  if (normalized.includes("photo") || normalized.includes("image") || normalized.includes("damage") || normalized.includes("accident")) {
    return "Photos";
  }
  if (normalized.includes("witness") || normalized.includes("statement")) {
    return "Witness Statement";
  }
  if (normalized.includes("report") || normalized.includes("assessment") || normalized.includes("estimate")) {
    return "Damage Report";
  }
  if (normalized.includes("deed") || normalized.includes("ownership") || normalized.includes("property")) {
    return "Property Ownership";
  }

  return "Unclassified";
};

export const classifyUpload = (fileName: string, kind: EvidenceKind): ClassifiedUpload => {
  const documentType = classifyByName(fileName);
  const lower = fileName.toLowerCase();

  if (lower.includes("blur") || lower.includes("fake")) {
    return {
      name: fileName,
      kind,
      documentType,
      aiStatus: "Flagged",
      confidenceScore: 63,
      reviewNote: "Potential quality or authenticity issue detected from file naming pattern."
    };
  }

  if (lower.includes("deed") || lower.includes("ownership")) {
    if (lower.includes("flagged") || documentType === "Property Ownership" && lower.includes("suspicious")) {
      return {
        name: fileName,
        kind,
        documentType: "Property Ownership",
        aiStatus: "Flagged",
        confidenceScore: 58,
        reviewNote: "Ownership document requires manual verification."
      };
    }
  }

  if (lower.includes("estimate") || lower.includes("quotation") || lower.includes("garage")) {
    return {
      name: fileName,
      kind,
      documentType: "Damage Report",
      aiStatus: "Flagged",
      confidenceScore: 72,
      reviewNote: "Repair estimate — inconsistency detected; officer review required."
    };
  }

  if (lower.includes("receipt") || lower.includes("invoice") || lower.includes("bill")) {
    const duplicatePharmacy = lower.includes("pharmacy") && /receipt\s*2|2\.jpg|_2\./.test(lower);
    return {
      name: fileName,
      kind,
      documentType: "Invoice",
      aiStatus: "Flagged",
      confidenceScore: duplicatePharmacy ? 68 : 78,
      reviewNote: duplicatePharmacy
        ? "Duplicate pharmacy receipt pattern — possible duplicate documentation."
        : "Invoice structure validated; details need officer confirmation."
    };
  }

  if (documentType === "Unclassified") {
    return {
      name: fileName,
      kind,
      documentType,
      aiStatus: "Flagged",
      confidenceScore: 44,
      reviewNote: "Filename pattern did not match any expected claims document type."
    };
  }

  return {
    name: fileName,
    kind,
    documentType,
    aiStatus: "Valid",
    confidenceScore: documentType === "Photos" ? 88 : documentType === "Police Report" ? 96 : 94,
    reviewNote: `Classified as ${documentType} and matched to expected claim evidence set.`
  };
};

export const getRequiredDocuments = (claimType: ClaimType) => requirementsByClaimType[claimType];

export const getDocumentChecklist = (claimType: ClaimType, fileNames: string[]) => {
  const classified = fileNames.map((fileName) => classifyUpload(fileName, fileName.toLowerCase().endsWith(".pdf") ? "pdf" : "image"));
  const required = getRequiredDocuments(claimType);

  return required.map((requiredDocument) => {
    const matched = classified.find((item) => item.documentType === requiredDocument);
    return {
      type: requiredDocument,
      status: matched ? "Uploaded" : "Missing",
      matched
    };
  });
};
