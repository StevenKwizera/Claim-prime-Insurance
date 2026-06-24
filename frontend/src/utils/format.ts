import { UserRole } from "@/types";

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));

export const formatRoleLabel = (role: UserRole) =>
  ({
    claimant: "Claimant",
    agent: "Insurance Agent",
    officer: "Claims Officer",
    supervisor: "Supervisor",
    admin: "System Administrator",
    "fraud-investigator": "Investigator",
  })[role];
