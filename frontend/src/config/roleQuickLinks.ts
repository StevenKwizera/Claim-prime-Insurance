import { UserRole } from "@/types";



export const roleQuickLinks: Record<UserRole, Array<{ label: string; to: string }>> = {

  claimant: [

    { label: "Submit a new claim", to: "/claims/new" },

    { label: "Resume saved drafts", to: "/claims/drafts" },

    { label: "Track my claims", to: "/tracking" },

    { label: "Upload evidence", to: "/evidence/upload" }

  ],

  agent: [

    { label: "Assist claim submission", to: "/claims/new" },

    { label: "Upload evidence", to: "/evidence/upload" },

    { label: "Track claims", to: "/tracking" },

    { label: "Generate reports", to: "/reports" }

  ],

  officer: [

    { label: "Verification queue", to: "/verification" },

    { label: "AI document results", to: "/verification/ai-results" },

    { label: "Approve or reject", to: "/evaluation/decision" },

    { label: "Request more info", to: "/verification/missing-request" },

    { label: "Reports & exports", to: "/reports" }

  ],

  supervisor: [

    { label: "Escalations", to: "/evaluation/escalations" },

    { label: "Analytics", to: "/analytics" },

    { label: "Reports", to: "/reports" }

  ],

  "fraud-investigator": [

    { label: "Flagged claims", to: "/fraud/flagged-claims" },

    { label: "Investigation workspace", to: "/fraud/investigator-workspace" },

    { label: "AI risk scores", to: "/fraud/risk-scoring" },

    { label: "Reports & exports", to: "/reports" }

  ],

  admin: [

    { label: "Manage users", to: "/admin/users" },

    { label: "Security & rules", to: "/admin/security" },

    { label: "Login activity", to: "/admin/login-activity" },

    { label: "Reports & audit", to: "/reports/audit-trail" }

  ]

};


