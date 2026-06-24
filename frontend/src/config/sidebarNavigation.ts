import {

  Activity,

  BadgeCheck,

  BarChart3,

  ClipboardCheck,

  Bell,

  CheckCircle2,

  FileDigit,

  FileSearch,

  Files,

  Gauge,

  LayoutDashboard,

  Lock,

  MailCheck,

  MessagesSquare,

  ScrollText,

  Settings,

  Shield,

  Siren,

  UserCog,

  Users,

  type LucideIcon

} from "lucide-react";

import { UserRole } from "@/types";



export type SidebarNavItem = {

  to: string;

  label: string;

  icon: LucideIcon;

  highlight?: boolean;

};



export type SidebarNavSection = {

  id: string;

  title: string;

  items: SidebarNavItem[];

};



export const defaultSidebarLinks = [];



/** Module 1 + 2 + 3 + 7 — claimant portal */

const claimantSections: SidebarNavSection[] = [

  {

    id: "claims",

    title: "Claims",

    items: [

      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },

      { to: "/claims/new", label: "Submit claim", icon: FileDigit },

      { to: "/claims/drafts", label: "Saved drafts", icon: FileSearch },

      { to: "/tracking", label: "Track status", icon: Activity },

      { to: "/evidence/upload", label: "Upload evidence", icon: Files },

      { to: "/evidence/gallery", label: "My evidence", icon: Files }

    ]

  },

  {

    id: "comms",

    title: "Communication",

    items: [

      { to: "/notifications", label: "Notifications", icon: MailCheck },

      { to: "/messages", label: "Messages", icon: MessagesSquare },

      { to: "/profile", label: "Profile", icon: UserCog },

      { to: "/settings", label: "Settings", icon: Settings }

    ]

  }

];



/** Intake support (legacy agent role — minimal menu) */

const agentSections: SidebarNavSection[] = [

  {

    id: "claims",

    title: "Claim intake",

    items: [

      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },

      { to: "/claims/new", label: "Assist submission", icon: FileDigit },

      { to: "/tracking", label: "Track claims", icon: Activity },

      { to: "/evidence/upload", label: "Upload evidence", icon: Files },

      { to: "/reports", label: "Reports & exports", icon: ScrollText }

    ]

  },

  {

    id: "comms",

    title: "Communication",

    items: [
      { to: "/notifications", label: "Notifications", icon: MailCheck },
      { to: "/messages", label: "Messages", icon: MessagesSquare }
    ]

  }

];



/** Modules 4, 5, 6 — officer */

const officerSections: SidebarNavSection[] = [
  {
    id: "workspace",
    title: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/verification/all-claims", label: "All claims by type", icon: ClipboardCheck }
    ]
  },
  {
    id: "review",
    title: "Review pipeline",
    items: [
      { to: "/verification", label: "Verification queue", icon: BadgeCheck },
      { to: "/verification/ai-results", label: "AI document results", icon: Gauge },
      { to: "/verification/missing-request", label: "Request more info", icon: MailCheck },
      { to: "/evaluation/decision", label: "Approve / reject", icon: CheckCircle2 }
    ]
  },
  {
    id: "resources",
    title: "Evidence & reports",
    items: [
      { to: "/evidence/gallery", label: "Evidence gallery", icon: Files },
      { to: "/reports", label: "Reports & exports", icon: ScrollText }
    ]
  },
  {
    id: "notes",
    title: "Case notes",
    items: [{ to: "/evaluation/internal-notes", label: "Internal notes", icon: ScrollText }]
  },
  {
    id: "comms",
    title: "Communication",
    items: [
      { to: "/notifications", label: "Notifications", icon: MailCheck },
      { to: "/messages", label: "Messages", icon: MessagesSquare },
      { to: "/team/users", label: "System users", icon: Users },
      { to: "/profile", label: "Profile", icon: UserCog }
    ]
  }
];



/** Oversight — escalations, analytics, reports (supervisor) */

const supervisorSections: SidebarNavSection[] = [

  {

    id: "oversight",

    title: "Oversight",

    items: [

      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },

      { to: "/verification/all-claims", label: "All claims by type", icon: ClipboardCheck },

      { to: "/team/users", label: "System users", icon: Users },

      { to: "/evaluation/escalations", label: "Escalations", icon: Shield },

      { to: "/evaluation/decision", label: "Decision review", icon: CheckCircle2 },

      { to: "/analytics", label: "Analytics", icon: BarChart3 },

      { to: "/reports", label: "Reports & exports", icon: ScrollText }

    ]

  },

  {

    id: "comms",

    title: "Communication",

    items: [
      { to: "/notifications", label: "Notifications", icon: MailCheck },
      { to: "/messages", label: "Messages", icon: MessagesSquare }
    ]

  }

];



/** Module 5 — fraud / investigator */

const fraudSections: SidebarNavSection[] = [

  {

    id: "fraud",

    title: "Investigation",

    items: [

      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },

      { to: "/fraud/flagged-claims", label: "Flagged claims", icon: Siren },

      { to: "/fraud/investigator-workspace", label: "Investigation workspace", icon: UserCog },

      { to: "/fraud/risk-scoring", label: "AI risk scores", icon: Gauge },

      { to: "/evidence/gallery", label: "Evidence gallery", icon: Files },

      { to: "/reports", label: "Reports & exports", icon: ScrollText }

    ]

  },

  {

    id: "comms",

    title: "Communication",

    items: [
      { to: "/notifications", label: "Notifications", icon: MailCheck },
      { to: "/messages", label: "Messages", icon: MessagesSquare }
    ]

  }

];



/** Module 1, 9, 10 — admin */

const adminSections: SidebarNavSection[] = [

  {

    id: "users",

    title: "Access control",

    items: [

      { to: "/admin/users", label: "Manage users", icon: Users, highlight: true },

      { to: "/admin/security", label: "System rules & security", icon: Lock },

      { to: "/admin/login-activity", label: "Login activity logs", icon: Activity }

    ]

  },

  {

    id: "oversight",

    title: "Reports & analytics",

    items: [

      { to: "/dashboard", label: "Admin dashboard", icon: LayoutDashboard },

      { to: "/reports", label: "Reports & exports", icon: ScrollText },

      { to: "/reports/audit-trail", label: "Audit trail", icon: Shield },

      { to: "/analytics/executive", label: "Analytics overview", icon: BarChart3 }

    ]

  },

  {

    id: "comms",

    title: "Communication",

    items: [

      { to: "/notifications", label: "Notification center", icon: Bell },

      { to: "/messages", label: "Messages", icon: MessagesSquare },

      { to: "/profile", label: "Profile", icon: UserCog },

      { to: "/settings", label: "Settings", icon: Settings }

    ]

  }

];



const roleSections: Record<UserRole, SidebarNavSection[]> = {

  claimant: claimantSections,

  agent: agentSections,

  officer: officerSections,

  supervisor: supervisorSections,

  "fraud-investigator": fraudSections,

  admin: adminSections

};



export function getSidebarSectionsForRole(role: UserRole): SidebarNavSection[] {

  return roleSections[role] ?? [{ id: "main", title: "Menu", items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] }];

}



export const adminSidebarSections = adminSections;



export function filterNavItems() {

  return [];

}


