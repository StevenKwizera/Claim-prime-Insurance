import { ClaimType } from "@/types";
import { getRequiredDocuments } from "@/utils/documentAI";

export interface AssistantResponse {
  answer: string;
  confidence: number;
  sources: string[];
  intent: string;
  suggestions?: string[];
}

interface KnowledgeEntry {
  intent: string;
  keywords: string[];
  answer: string | ((question: string) => string);
  confidence: number;
  sources: string[];
  suggestions?: string[];
}

const claimTypeAliases: Record<ClaimType, string[]> = {
  auto: ["auto", "motor", "car", "vehicle", "accident"],
  health: ["health", "medical", "hospital", "treatment"],
  property: ["property", "house", "building", "ownership", "home"]
};

const roleAliases = {
  claimant: ["claimant", "customer", "client"],
  agent: ["agent", "insurance agent"],
  officer: ["officer", "claim officer", "claims officer"],
  supervisor: ["supervisor", "manager"],
  admin: ["admin", "administrator"],
  "fraud-investigator": ["fraud officer", "fraud investigator", "investigator"]
} as const;

const normalize = (value: string) => value.toLowerCase().replace(/[^\w\s-]/g, " ");

const includesPhrase = (text: string, phrase: string) => text.includes(normalize(phrase));

const detectClaimType = (question: string): ClaimType | null => {
  const normalized = normalize(question);
  if (claimTypeAliases.auto.some((item) => normalized.includes(item))) return "auto";
  if (claimTypeAliases.health.some((item) => normalized.includes(item))) return "health";
  if (claimTypeAliases.property.some((item) => normalized.includes(item))) return "property";
  return null;
};

const detectRole = (question: string): string | null => {
  const normalized = normalize(question);
  for (const [role, aliases] of Object.entries(roleAliases)) {
    if (aliases.some((alias) => normalized.includes(alias))) return role;
  }
  return null;
};

const formatClaimType = (claimType: ClaimType) =>
  `${claimType.charAt(0).toUpperCase()}${claimType.slice(1)}`;

const documentRequirementsAnswer = (question: string) => {
  const claimType = detectClaimType(question);
  if (!claimType) {
    return "Document requirements depend on claim type. Auto claims usually need ID Document, Police Report, Invoice, Photos, and Damage Report. Health claims usually need ID Document, Medical Report, and Invoice. Property claims usually need ID Document, Property Ownership, Photos, Damage Report, and Invoice.";
  }

  const docs = getRequiredDocuments(claimType);
  return `${formatClaimType(claimType)} claims require: ${docs.join(", ")}. Uploading these documents helps the system verify the claim faster and avoid missing-document alerts.`;
};

const roleAnswer = (question: string) => {
  const role = detectRole(question);
  const map: Record<string, string> = {
    claimant:
      "Claimants can submit claims, save drafts, upload required documents, track claim progress, and receive notifications.",
    agent:
      "Insurance Agents can help customers submit claims, validate policy details, support document upload, and route complete claims for officer review.",
    officer:
      "Claim Officers review claim details, AI verification results, evidence, notes, and fraud signals. They can approve, reject, request more information, or escalate claims.",
    supervisor:
      "Supervisors manage escalations, high-value or complex claims, SLA pressure, approval control, and supervisory decisions.",
    admin:
      "Administrators manage users, roles, permissions, login activity, security settings, compliance access, and system governance.",
    "fraud-investigator":
      "Fraud Investigation Officers review high-risk claims, tampering alerts, suspicious evidence, network patterns, and investigation notes."
  };

  return role ? map[role] : "The system supports Claimant, Insurance Agent, Claim Officer, Supervisor, Administrator, and Fraud Investigation Officer. Each role sees a different dashboard and only the features needed for that work.";
};

const submissionReferenceAnswer =
  "When a claim is submitted, the system generates a unique reference number such as CLM-2026-00125. That reference is used for tracking, notifications, and staff review.";

const knowledgeBase: KnowledgeEntry[] = [
  {
    intent: "login_security",
    keywords: ["login", "sign in", "otp", "two factor", "2fa", "password", "authentication"],
    answer:
      "Users access the platform through secure login with email and password. The project also includes OTP verification and security settings that can represent optional two-factor authentication and session controls.",
    confidence: 0.95,
    sources: ["Login flow", "Security settings"],
    suggestions: ["How do roles work?", "Where can admins manage security?"]
  },
  {
    intent: "registration",
    keywords: ["register", "sign up", "request access", "create account"],
    answer:
      "New users can use Register to request access. Staff and customer onboarding details are captured there before role-based access is assigned.",
    confidence: 0.92,
    sources: ["Register page", "Access control"]
  },
  {
    intent: "claim_submission",
    keywords: ["submit", "new claim", "start claim", "claim form", "claim submission"],
    answer:
      "To submit a claim, open Claims, complete the multi-step form, enter policy and incident details, upload evidence, review the AI intake summary, and submit. The system then generates a claim reference and routes the claim automatically.",
    confidence: 0.97,
    sources: ["Claims module", "Submission workflow"],
    suggestions: ["What documents are required for an auto claim?", "Can I save a draft?"]
  },
  {
    intent: "drafts",
    keywords: ["draft", "save draft", "resume draft", "unfinished claim"],
    answer:
      "Yes. A claim can be saved as a draft and resumed later. Draft claims remain editable until final submission.",
    confidence: 0.95,
    sources: ["Draft workflow", "Claims store"]
  },
  {
    intent: "reference_number",
    keywords: ["reference", "reference number", "claim number", "tracking number"],
    answer: submissionReferenceAnswer,
    confidence: 0.96,
    sources: ["Claim confirmation", "Submission workflow"]
  },
  {
    intent: "document_requirements",
    keywords: ["required document", "requirements", "documents needed", "what documents", "what do i upload", "needed for claim"],
    answer: documentRequirementsAnswer,
    confidence: 0.98,
    sources: ["Document AI rules", "Claim-type requirements"],
    suggestions: ["What documents are required for a health claim?", "How does AI classify uploads?"]
  },
  {
    intent: "upload_classification",
    keywords: ["classify", "classification", "upload", "ai intake", "document type"],
    answer:
      "The current frontend AI intake uses document rules to classify uploads into types such as ID Document, Police Report, Medical Report, Invoice, Photos, Damage Report, Witness Statement, and Property Ownership. It also shows confidence and missing required documents.",
    confidence: 0.97,
    sources: ["Document AI rules", "Submission form AI intake"]
  },
  {
    intent: "verification",
    keywords: ["verify", "verification", "ocr", "manual review", "valid", "flagged", "invalid"],
    answer:
      "The Verification module lets staff review uploaded documents, AI classification, confidence score, verification status, tampering alerts, and the AI explanation panel before approving or requesting more information.",
    confidence: 0.97,
    sources: ["Verification module", "AI intake results"],
    suggestions: ["How are missing documents handled?", "What is the AI explanation panel?"]
  },
  {
    intent: "missing_documents",
    keywords: ["missing document", "missing files", "missing requirements", "required missing"],
    answer:
      "If required documents are missing, the AI intake summary flags them and the claim can still move forward for review. Staff can then request additional information, and the user receives a notification.",
    confidence: 0.96,
    sources: ["Submission AI summary", "Verification workflow", "Notifications"]
  },
  {
    intent: "routing",
    keywords: ["route", "routing", "assigned", "assigned team", "assigned officer", "smart routing"],
    answer:
      "The system routes claims automatically based on claim type and risk score. For example, health claims go to the Health Claims Unit, motor claims go to the Motor Claims Unit, and higher-risk claims can go to the Fraud Investigation Team.",
    confidence: 0.96,
    sources: ["Claims routing rules", "Claims store"]
  },
  {
    intent: "tracking",
    keywords: ["track", "status", "progress", "timeline", "real time", "claim status"],
    answer:
      "Use the Tracking page to follow claim status, progress percentage, assigned team, assigned officer, estimated completion date, and timeline history. Staff and customers can both monitor movement through the lifecycle.",
    confidence: 0.97,
    sources: ["Tracking module", "Claim timeline"],
    suggestions: ["What statuses can a claim have?", "How do notifications work?"]
  },
  {
    intent: "claim_statuses",
    keywords: ["statuses", "status list", "under review", "approved", "rejected", "investigation"],
    answer:
      "Claims can move through statuses such as Draft, Pending, Under Review, Investigation, Approved, and Rejected. The tracking screen shows progress based on the current status.",
    confidence: 0.95,
    sources: ["Claim status model", "Tracking module"]
  },
  {
    intent: "evaluation",
    keywords: ["approve", "reject", "request info", "evaluation", "decision", "escalate"],
    answer:
      "In the claim workspace, authorized roles can approve, reject, request more information, escalate to supervisor, or start investigation. Each action updates claim history and notifications.",
    confidence: 0.97,
    sources: ["Claim workspace", "Claims workflow store"]
  },
  {
    intent: "supervisor",
    keywords: ["supervisor", "final review", "escalation", "sign", "digital signature"],
    answer:
      "Supervisors handle escalated claims, complex cases, SLA risks, and final review decisions. The UI also includes supervisory approval and governance controls.",
    confidence: 0.94,
    sources: ["Supervisor workflow", "Role-based dashboards"]
  },
  {
    intent: "fraud",
    keywords: ["fraud", "risk", "investigation", "flagged", "tampering", "duplicate", "suspicious"],
    answer:
      "Fraud Detection shows risk score, flagged claims, investigation status, tampering alerts, suspicious evidence signals, and pattern-visualization placeholders. High-risk claims can be routed directly to investigation.",
    confidence: 0.97,
    sources: ["Fraud module", "Risk scoring and routing"]
  },
  {
    intent: "notifications",
    keywords: ["notification", "sms", "email", "message", "alert", "in app"],
    answer:
      "The platform supports in-app notifications, email-style alerts, and SMS-style delivery tracking for submission, missing documents, approval, rejection, escalation, and investigation updates.",
    confidence: 0.95,
    sources: ["Notifications module", "Delivery tracking"]
  },
  {
    intent: "reports",
    keywords: ["report", "compliance", "audit", "export", "pdf", "excel", "csv"],
    answer:
      "Reports and Compliance support operational reports, audit trails, regulatory templates, report builder tools, and exports in PDF, Excel, and CSV formats.",
    confidence: 0.96,
    sources: ["Reports module", "Compliance dashboard"]
  },
  {
    intent: "analytics",
    keywords: ["analytics", "dashboard", "trend", "processing time", "management"],
    answer:
      "The analytics side of the system shows claims volume, approval rates, fraud alerts, average processing time, trend analysis, and regional signals for supervisors and administrators. This is not a payment system.",
    confidence: 0.95,
    sources: ["Analytics module", "Executive dashboard"]
  },
  {
    intent: "roles",
    keywords: ["role", "permission", "admin", "user access", "who can", "what can"],
    answer: roleAnswer,
    confidence: 0.96,
    sources: ["Role-based dashboards", "Access control"]
  }
];

const defaultResponse: AssistantResponse = {
  answer:
    "I can answer questions about login, registration, claim submission, drafts, reference numbers, required documents by claim type, AI verification, routing, tracking, approvals, fraud review, notifications, roles, reports, and analytics.",
  confidence: 0.7,
  sources: ["System help knowledge"],
  intent: "fallback",
  suggestions: [
    "What documents are required for an auto claim?",
    "How do I submit a claim?",
    "How does claim routing work?"
  ]
};

export const answerSystemQuestion = (question: string): AssistantResponse => {
  const normalized = normalize(question);

  const ranked = knowledgeBase
    .map((entry) => {
      const directMatches = entry.keywords.reduce(
        (total, keyword) => total + (includesPhrase(normalized, keyword) ? 1 : 0),
        0
      );

      const tokenMatches = entry.keywords.reduce((total, keyword) => {
        const pieces = normalize(keyword).split(/\s+/).filter(Boolean);
        return total + pieces.reduce((sum, piece) => sum + (normalized.includes(piece) ? 0.15 : 0), 0);
      }, 0);

      return {
        entry,
        score: directMatches + tokenMatches
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best) return defaultResponse;

  const answer =
    typeof best.entry.answer === "function" ? best.entry.answer(question) : best.entry.answer;

  const confidence = Math.min(0.99, best.entry.confidence + Math.min(best.score, 3) * 0.01);

  return {
    answer,
    confidence,
    sources: best.entry.sources,
    intent: best.entry.intent,
    suggestions: best.entry.suggestions ?? defaultResponse.suggestions
  };
};
