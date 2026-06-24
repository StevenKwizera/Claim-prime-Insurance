import { resolveProjectEvidenceUrl } from "../config/evidenceMedia";
import { Claim, ClaimDocument, EvidenceKind } from "@/types";

type DocOpts = {
  id: string;
  name: string;
  kind: EvidenceKind;
  tag: string;
  at: string;
  aiStatus?: ClaimDocument["aiStatus"];
  version?: number;
  previewUrl?: string;
  sizeBytes?: number;
  documentType?: string;
};

const d = (claimId: string, opts: DocOpts): ClaimDocument => ({
  id: opts.id,
  name: opts.name,
  kind: opts.kind,
  tag: opts.tag,
  uploadedAt: opts.at,
  aiStatus: opts.aiStatus ?? "Valid",
  version: opts.version ?? 1,
  documentType: opts.documentType,
  sizeBytes: opts.sizeBytes,
  previewUrl:
    opts.previewUrl ??
    resolveProjectEvidenceUrl(claimId, {
      id: opts.id,
      name: opts.name,
      kind: opts.kind,
      tag: opts.tag
    })
});

const t = (
  id: string,
  label: string,
  at: string,
  actor: string,
  tone: "neutral" | "success" | "danger" | "warning" = "neutral"
) => ({ id, label, at, actor, tone });

/** Rich demo claims with photos, videos, PDFs, and other documents */
export const seedClaims: Claim[] = [
  {
    id: "CLM-24091",
    claimantName: "Aline Mukamana",
    policyNumber: "AUTO-44390",
    type: "auto",
    status: "Under Review",
    region: "Kigali",
    submittedAt: "2026-04-18T09:00:00Z",
    estimatedCompletion: "2026-04-30T17:00:00Z",
    riskScore: 26,
    aiSummary: "Police abstract matches vehicle registration. Dashcam and scene photos support liability.",
    assignedTeam: "Motor Claims Unit",
    assignedOfficer: "Grace Uwase",
    documents: [
      d("CLM-24091", { id: "d1", name: "Front bumper damage.jpg", kind: "image", tag: "damage", at: "2026-04-18T09:15:00Z", version: 2 }),
      d("CLM-24091", { id: "d1b", name: "Rear panel close-up.jpg", kind: "image", tag: "damage", at: "2026-04-18T09:16:00Z" }),
      d("CLM-24091", { id: "d1c", name: "License plate photo.jpg", kind: "image", tag: "vehicle", at: "2026-04-18T09:17:00Z" }),
      d("CLM-24091", { id: "d2", name: "Police Abstract.pdf", kind: "pdf", tag: "official", at: "2026-04-18T09:20:00Z", documentType: "Police abstract" }),
      d("CLM-24091", { id: "d3", name: "Garage repair estimate.pdf", kind: "pdf", tag: "cost", at: "2026-04-19T12:20:00Z", aiStatus: "Flagged", version: 3 }),
      d("CLM-24091", { id: "d3v", name: "Dashcam incident clip.mp4", kind: "video", tag: "video-evidence", at: "2026-04-18T10:05:00Z", sizeBytes: 4_200_000 }),
      d("CLM-24091", { id: "d3w", name: "Witness statement.docx", kind: "document", tag: "witness", at: "2026-04-19T08:00:00Z", documentType: "Witness statement" })
    ],
    timeline: [
      t("t1", "Claim submitted", "2026-04-18T09:00:00Z", "Aline Mukamana"),
      t("t2", "Auto-routed to officer", "2026-04-18T09:08:00Z", "System", "success"),
      t("t3", "Video evidence uploaded", "2026-04-18T10:06:00Z", "Aline Mukamana", "success"),
      t("t4", "Receipt flagged for review", "2026-04-19T12:24:00Z", "AI Verification", "warning")
    ]
  },
  {
    id: "CLM-24092",
    claimantName: "Eric Ndayisenga",
    policyNumber: "HLT-12900",
    type: "health",
    status: "Pending",
    region: "Northern",
    submittedAt: "2026-04-20T08:15:00Z",
    estimatedCompletion: "2026-05-02T17:00:00Z",
    riskScore: 11,
    aiSummary: "Medical note and lab results on file. Discharge summary and pharmacy invoice still expected.",
    assignedTeam: "Health Claims Unit",
    assignedOfficer: "Daniel Mugisha",
    documents: [
      d("CLM-24092", { id: "d4", name: "Hospital admission note.pdf", kind: "pdf", tag: "medical", at: "2026-04-20T08:30:00Z" }),
      d("CLM-24092", { id: "d4b", name: "Lab results printout.pdf", kind: "pdf", tag: "medical", at: "2026-04-20T08:35:00Z" }),
      d("CLM-24092", { id: "d4i", name: "Ward photo â€” patient ID.jpg", kind: "image", tag: "medical", at: "2026-04-20T08:40:00Z" }),
      d("CLM-24092", { id: "d4v", name: "Clinic walk-through.mp4", kind: "video", tag: "facility", at: "2026-04-21T11:00:00Z" })
    ],
    timeline: [
      t("t4", "Claim started as draft", "2026-04-19T18:00:00Z", "Eric Ndayisenga"),
      t("t5", "Submitted for review", "2026-04-20T08:15:00Z", "Eric Ndayisenga", "success")
    ]
  },
  {
    id: "CLM-24093",
    claimantName: "Claudine Nyiraneza",
    policyNumber: "PRP-55020",
    type: "property",
    status: "Investigation",
    region: "Western",
    submittedAt: "2026-04-10T07:45:00Z",
    estimatedCompletion: "2026-05-05T17:00:00Z",
    riskScore: 74,
    aiSummary: "Ownership deed flagged. Extensive photo and video evidence of flood damage under review.",
    assignedTeam: "Fraud Investigation Team",
    assignedOfficer: "Fabrice Iradukunda",
    documents: [
      d("CLM-24093", { id: "d5", name: "Ownership deed.pdf", kind: "pdf", tag: "legal", at: "2026-04-10T08:00:00Z", aiStatus: "Flagged" }),
      d("CLM-24093", { id: "d6", name: "Living room flood damage.jpg", kind: "image", tag: "damage", at: "2026-04-10T08:04:00Z", version: 2 }),
      d("CLM-24093", { id: "d6b", name: "Kitchen water line.jpg", kind: "image", tag: "damage", at: "2026-04-10T08:05:00Z" }),
      d("CLM-24093", { id: "d6c", name: "Roof leak interior.jpg", kind: "image", tag: "damage", at: "2026-04-10T08:06:00Z" }),
      d("CLM-24093", { id: "d6v", name: "Property damage walkthrough.mp4", kind: "video", tag: "damage", at: "2026-04-10T09:30:00Z" }),
      d("CLM-24093", { id: "d6r", name: "Contractor repair quote.pdf", kind: "pdf", tag: "cost", at: "2026-04-11T14:00:00Z" }),
      d("CLM-24093", { id: "d6x", name: "Insurance adjuster notes.xlsx", kind: "document", tag: "internal", at: "2026-04-12T10:00:00Z" })
    ],
    timeline: [
      t("t6", "Manual escalation created", "2026-04-11T09:00:00Z", "Grace Uwase", "warning"),
      t("t7", "Fraud investigation opened", "2026-04-12T11:30:00Z", "Supervisor", "danger")
    ]
  },
  {
    id: "CLM-24101",
    claimantName: "Aline Mukamana",
    policyNumber: "HLT-88210",
    type: "health",
    status: "Approved",
    region: "Kigali",
    submittedAt: "2026-03-05T10:00:00Z",
    estimatedCompletion: "2026-03-20T17:00:00Z",
    riskScore: 8,
    aiSummary: "Outpatient visit fully documented. All invoices validated.",
    assignedTeam: "Health Claims Unit",
    assignedOfficer: "Grace Uwase",
    documents: [
      d("CLM-24101", { id: "h1", name: "Clinic invoice.pdf", kind: "pdf", tag: "billing", at: "2026-03-05T10:30:00Z" }),
      d("CLM-24101", { id: "h2", name: "Prescription scan.jpg", kind: "image", tag: "medical", at: "2026-03-05T10:35:00Z" }),
      d("CLM-24101", { id: "h3", name: "Payment receipt.jpg", kind: "image", tag: "billing", at: "2026-03-05T11:00:00Z" })
    ],
    timeline: [
      t("h-t1", "Claim submitted", "2026-03-05T10:00:00Z", "Aline Mukamana"),
      t("h-t2", "Approved", "2026-03-18T15:00:00Z", "Grace Uwase", "success")
    ]
  },
  {
    id: "CLM-24102",
    claimantName: "Jean Mukamana",
    policyNumber: "AUTO-77102",
    type: "auto",
    status: "Under Review",
    region: "Kigali",
    submittedAt: "2026-05-28T07:30:00Z",
    estimatedCompletion: "2026-06-10T17:00:00Z",
    riskScore: 19,
    aiSummary: "Side-impact collision. Multiple vehicle photos and police report uploaded.",
    assignedTeam: "Motor Claims Unit",
    assignedOfficer: "Grace Uwase",
    documents: [
      d("CLM-24102", { id: "j1", name: "Driver side dent.jpg", kind: "image", tag: "damage", at: "2026-05-28T08:00:00Z" }),
      d("CLM-24102", { id: "j2", name: "Passenger door.jpg", kind: "image", tag: "damage", at: "2026-05-28T08:01:00Z" }),
      d("CLM-24102", { id: "j3", name: "Police report Kigali.pdf", kind: "pdf", tag: "official", at: "2026-05-28T08:30:00Z" }),
      d("CLM-24102", { id: "j4", name: "Intersection CCTV export.mp4", kind: "video", tag: "video-evidence", at: "2026-05-28T09:00:00Z" }),
      d("CLM-24102", { id: "j5", name: "Tow truck invoice.pdf", kind: "pdf", tag: "cost", at: "2026-05-29T12:00:00Z" })
    ],
    timeline: [
      t("j-t1", "Claim submitted", "2026-05-28T07:30:00Z", "Jean Mukamana", "success")
    ]
  },
  {
    id: "CLM-24103",
    claimantName: "Aline Mukamana",
    policyNumber: "PRP-33100",
    type: "property",
    status: "Draft",
    region: "Kigali",
    submittedAt: "2026-06-01T14:00:00Z",
    estimatedCompletion: "2026-06-20T17:00:00Z",
    riskScore: 15,
    aiSummary: "Draft â€” fire damage claim. Photos uploaded; incident report pending.",
    assignedTeam: "Property Claims Unit",
    assignedOfficer: "Unassigned",
    documents: [
      d("CLM-24103", { id: "p1", name: "Kitchen fire aftermath.jpg", kind: "image", tag: "damage", at: "2026-06-01T14:10:00Z" }),
      d("CLM-24103", { id: "p2", name: "Smoke damage bedroom.jpg", kind: "image", tag: "damage", at: "2026-06-01T14:12:00Z" })
    ],
    timeline: [t("p-t1", "Draft saved", "2026-06-01T14:00:00Z", "Aline Mukamana")]
  },
  {
    id: "CLM-24104",
    claimantName: "Patrick Habimana",
    policyNumber: "AUTO-22001",
    type: "auto",
    status: "Rejected",
    region: "Southern",
    submittedAt: "2026-02-14T11:00:00Z",
    estimatedCompletion: "2026-02-28T17:00:00Z",
    riskScore: 62,
    aiSummary: "Rejected â€” policy lapsed before incident date per registry check.",
    assignedTeam: "Motor Claims Unit",
    assignedOfficer: "Jean Niyonzima",
    documents: [
      d("CLM-24104", { id: "r1", name: "Accident scene wide.jpg", kind: "image", tag: "damage", at: "2026-02-14T11:30:00Z" }),
      d("CLM-24104", { id: "r2", name: "Policy status letter.pdf", kind: "pdf", tag: "official", at: "2026-02-20T09:00:00Z", aiStatus: "Flagged" }),
      d("CLM-24104", { id: "r3", name: "Claimant explanation.docx", kind: "document", tag: "correspondence", at: "2026-02-15T10:00:00Z" })
    ],
    timeline: [
      t("r-t1", "Claim submitted", "2026-02-14T11:00:00Z", "Patrick Habimana"),
      t("r-t2", "Rejected â€” coverage gap", "2026-02-22T16:00:00Z", "Jean Niyonzima", "danger")
    ]
  },
  {
    id: "CLM-24105",
    claimantName: "Marie Uwimana",
    policyNumber: "HLT-44055",
    type: "health",
    status: "Under Review",
    region: "Eastern",
    submittedAt: "2026-05-15T06:45:00Z",
    estimatedCompletion: "2026-05-30T17:00:00Z",
    riskScore: 22,
    aiSummary: "Maternity package claim with ultrasound imaging and hospital discharge pack.",
    assignedTeam: "Health Claims Unit",
    assignedOfficer: "David Habineza",
    documents: [
      d("CLM-24105", { id: "m1", name: "Ultrasound image.jpg", kind: "image", tag: "medical", at: "2026-05-15T07:00:00Z" }),
      d("CLM-24105", { id: "m2", name: "Discharge summary.pdf", kind: "pdf", tag: "medical", at: "2026-05-15T07:30:00Z" }),
      d("CLM-24105", { id: "m3", name: "Hospital itemized bill.pdf", kind: "pdf", tag: "billing", at: "2026-05-16T08:00:00Z" }),
      d("CLM-24105", { id: "m4", name: "NICU tour video.mp4", kind: "video", tag: "facility", at: "2026-05-16T09:00:00Z" }),
      d("CLM-24105", { id: "m5", name: "National ID copy.jpg", kind: "image", tag: "identity", at: "2026-05-15T06:50:00Z" })
    ],
    timeline: [t("m-t1", "Submitted", "2026-05-15T06:45:00Z", "Marie Uwimana", "success")]
  },
  {
    id: "CLM-24106",
    claimantName: "Samuel Nsengimana",
    policyNumber: "PRP-90221",
    type: "property",
    status: "Approved",
    region: "Northern",
    submittedAt: "2026-01-20T09:00:00Z",
    estimatedCompletion: "2026-02-05T17:00:00Z",
    riskScore: 12,
    aiSummary: "Hail damage to roof approved after site inspection photos and roofer quote.",
    assignedTeam: "Property Claims Unit",
    assignedOfficer: "Grace Uwase",
    documents: [
      d("CLM-24106", { id: "s1", name: "Roof hail damage 1.jpg", kind: "image", tag: "damage", at: "2026-01-20T09:30:00Z" }),
      d("CLM-24106", { id: "s2", name: "Roof hail damage 2.jpg", kind: "image", tag: "damage", at: "2026-01-20T09:31:00Z" }),
      d("CLM-24106", { id: "s3", name: "Drone roof survey.mp4", kind: "video", tag: "survey", at: "2026-01-21T10:00:00Z" }),
      d("CLM-24106", { id: "s4", name: "Roofer quote signed.pdf", kind: "pdf", tag: "cost", at: "2026-01-22T11:00:00Z" })
    ],
    timeline: [
      t("s-t1", "Submitted", "2026-01-20T09:00:00Z", "Samuel Nsengimana"),
      t("s-t2", "Approved", "2026-02-01T14:00:00Z", "Grace Uwase", "success")
    ]
  },
  {
    id: "CLM-24107",
    claimantName: "Vestine Mukeshimana",
    policyNumber: "AUTO-11880",
    type: "auto",
    status: "Investigation",
    region: "Western",
    submittedAt: "2026-05-01T16:00:00Z",
    estimatedCompletion: "2026-06-15T17:00:00Z",
    riskScore: 81,
    aiSummary: "High-value total loss. Staged accident indicators; fraud team reviewing video timeline.",
    assignedTeam: "Fraud Investigation Team",
    assignedOfficer: "Fabrice Iradukunda",
    documents: [
      d("CLM-24107", { id: "v1", name: "Total loss overview.jpg", kind: "image", tag: "damage", at: "2026-05-01T16:30:00Z" }),
      d("CLM-24107", { id: "v2", name: "Engine bay fire.jpg", kind: "image", tag: "damage", at: "2026-05-01T16:32:00Z" }),
      d("CLM-24107", { id: "v3", name: "Third party statement.pdf", kind: "pdf", tag: "official", at: "2026-05-02T08:00:00Z", aiStatus: "Flagged" }),
      d("CLM-24107", { id: "v4", name: "Dashcam full sequence.mp4", kind: "video", tag: "video-evidence", at: "2026-05-01T17:00:00Z" }),
      d("CLM-24107", { id: "v5", name: "Garage inspection report.pdf", kind: "pdf", tag: "technical", at: "2026-05-03T12:00:00Z" }),
      d("CLM-24107", { id: "v6", name: "Fraud analyst memo.docx", kind: "document", tag: "internal", at: "2026-05-04T09:00:00Z", aiStatus: "Flagged" })
    ],
    timeline: [
      t("v-t1", "Submitted", "2026-05-01T16:00:00Z", "Vestine Mukeshimana"),
      t("v-t2", "Escalated to fraud", "2026-05-05T10:00:00Z", "Fabrice Iradukunda", "danger")
    ]
  },
  {
    id: "CLM-24108",
    claimantName: "Eric Ndayisenga",
    policyNumber: "PRP-77200",
    type: "property",
    status: "Pending",
    region: "Northern",
    submittedAt: "2026-06-02T08:00:00Z",
    estimatedCompletion: "2026-06-25T17:00:00Z",
    riskScore: 18,
    aiSummary: "Burglary claim â€” broken window and inventory list. Photos and police OB uploaded.",
    assignedTeam: "Property Claims Unit",
    assignedOfficer: "Daniel Mugisha",
    documents: [
      d("CLM-24108", { id: "e1", name: "Broken window entry.jpg", kind: "image", tag: "damage", at: "2026-06-02T08:20:00Z" }),
      d("CLM-24108", { id: "e2", name: "Stolen items inventory.xlsx", kind: "document", tag: "inventory", at: "2026-06-02T08:40:00Z" }),
      d("CLM-24108", { id: "e3", name: "Police OB burglary.pdf", kind: "pdf", tag: "official", at: "2026-06-02T09:00:00Z" }),
      d("CLM-24108", { id: "e4", name: "Security camera clip.mp4", kind: "video", tag: "video-evidence", at: "2026-06-02T09:30:00Z" })
    ],
    timeline: [t("e-t1", "Submitted", "2026-06-02T08:00:00Z", "Eric Ndayisenga", "success")]
  },
  {
    id: "CLM-24109",
    claimantName: "Claudine Nyiraneza",
    policyNumber: "HLT-66012",
    type: "health",
    status: "Under Review",
    region: "Western",
    submittedAt: "2026-05-20T12:00:00Z",
    estimatedCompletion: "2026-06-05T17:00:00Z",
    riskScore: 35,
    aiSummary: "Dental surgery claim â€” before/after imaging and specialist letter attached.",
    assignedTeam: "Health Claims Unit",
    assignedOfficer: "Grace Uwase",
    documents: [
      d("CLM-24109", { id: "c1", name: "Dental X-ray.jpg", kind: "image", tag: "medical", at: "2026-05-20T12:30:00Z" }),
      d("CLM-24109", { id: "c2", name: "Post-procedure photo.jpg", kind: "image", tag: "medical", at: "2026-05-22T10:00:00Z" }),
      d("CLM-24109", { id: "c3", name: "Specialist referral.pdf", kind: "pdf", tag: "medical", at: "2026-05-20T13:00:00Z" }),
      d("CLM-24109", { id: "c4", name: "Clinic payment proof.pdf", kind: "pdf", tag: "billing", at: "2026-05-21T09:00:00Z" })
    ],
    timeline: [t("c-t1", "Submitted", "2026-05-20T12:00:00Z", "Claudine Nyiraneza")]
  },
  {
    id: "CLM-24110",
    claimantName: "Aline Mukamana",
    policyNumber: "AUTO-99001",
    type: "auto",
    status: "Approved",
    region: "Kigali",
    submittedAt: "2025-12-10T10:00:00Z",
    estimatedCompletion: "2025-12-22T17:00:00Z",
    riskScore: 5,
    aiSummary: "Minor parking scrape â€” quick repair approved with photo evidence only.",
    assignedTeam: "Motor Claims Unit",
    assignedOfficer: "Grace Uwase",
    documents: [
      d("CLM-24110", { id: "a1", name: "Scratch close-up.jpg", kind: "image", tag: "damage", at: "2025-12-10T10:15:00Z" }),
      d("CLM-24110", { id: "a2", name: "Parking lot context.jpg", kind: "image", tag: "scene", at: "2025-12-10T10:16:00Z" }),
      d("CLM-24110", { id: "a3", name: "Quick repair invoice.pdf", kind: "pdf", tag: "cost", at: "2025-12-11T08:00:00Z" })
    ],
    timeline: [
      t("a-t1", "Submitted", "2025-12-10T10:00:00Z", "Aline Mukamana"),
      t("a-t2", "Approved", "2025-12-18T11:00:00Z", "Grace Uwase", "success")
    ]
  },
  {
    id: "CLM-24111",
    claimantName: "Jean Mukamana",
    policyNumber: "PRP-44500",
    type: "property",
    status: "Pending",
    region: "Kigali",
    submittedAt: "2026-06-03T07:00:00Z",
    estimatedCompletion: "2026-06-28T17:00:00Z",
    riskScore: 20,
    aiSummary: "Storm damage to perimeter wall. Engineer report and multiple site photos submitted.",
    assignedTeam: "Property Claims Unit",
    assignedOfficer: "David Habineza",
    documents: [
      d("CLM-24111", { id: "w1", name: "Collapsed wall section.jpg", kind: "image", tag: "damage", at: "2026-06-03T07:30:00Z" }),
      d("CLM-24111", { id: "w2", name: "Storm aftermath yard.jpg", kind: "image", tag: "scene", at: "2026-06-03T07:32:00Z" }),
      d("CLM-24111", { id: "w3", name: "Structural engineer report.pdf", kind: "pdf", tag: "technical", at: "2026-06-03T10:00:00Z" }),
      d("CLM-24111", { id: "w4", name: "Site survey drone.mp4", kind: "video", tag: "survey", at: "2026-06-03T11:00:00Z" }),
      d("CLM-24111", { id: "w5", name: "Meteo rainfall data.pdf", kind: "pdf", tag: "official", at: "2026-06-04T08:00:00Z" })
    ],
    timeline: [t("w-t1", "Submitted", "2026-06-03T07:00:00Z", "Jean Mukamana", "success")]
  },
  {
    id: "CLM-24112",
    claimantName: "Ingabire Adeline",
    policyNumber: "HLT-33019",
    type: "health",
    status: "Investigation",
    region: "Kigali",
    submittedAt: "2026-04-28T13:00:00Z",
    estimatedCompletion: "2026-05-20T17:00:00Z",
    riskScore: 68,
    aiSummary: "Duplicate billing flags on pharmacy line items. Additional video and receipt audit requested.",
    assignedTeam: "Fraud Investigation Team",
    assignedOfficer: "Fabrice Iradukunda",
    documents: [
      d("CLM-24112", { id: "i1", name: "Pharmacy receipt 1.jpg", kind: "image", tag: "billing", at: "2026-04-28T13:30:00Z", aiStatus: "Flagged" }),
      d("CLM-24112", { id: "i2", name: "Pharmacy receipt 2.jpg", kind: "image", tag: "billing", at: "2026-04-28T13:31:00Z", aiStatus: "Flagged" }),
      d("CLM-24112", { id: "i3", name: "Prescription PDF bundle.pdf", kind: "pdf", tag: "medical", at: "2026-04-28T14:00:00Z" }),
      d("CLM-24112", { id: "i4", name: "Pharmacy counter CCTV.mp4", kind: "video", tag: "video-evidence", at: "2026-04-29T09:00:00Z" }),
      d("CLM-24112", { id: "i5", name: "Investigator checklist.docx", kind: "document", tag: "internal", at: "2026-05-02T10:00:00Z" })
    ],
    timeline: [
      t("i-t1", "Submitted", "2026-04-28T13:00:00Z", "Ingabire Adeline"),
      t("i-t2", "Flagged for duplicate charges", "2026-05-01T09:00:00Z", "AI Verification", "warning"),
      t("i-t3", "Fraud review opened", "2026-05-03T11:00:00Z", "Fabrice Iradukunda", "danger")
    ]
  }
];
