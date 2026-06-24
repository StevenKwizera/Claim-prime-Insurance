import { UserRole } from "@/types";

/** Matches `backend/database.json` seed users. Password for all: `password` */
export const DEMO_ACCOUNTS: Array<{
  email: string;
  password: string;
  role: UserRole;
  label: string;
}> = [
  { email: "claimant@prime.rw", password: "password", role: "claimant", label: "Claimant" },
  { email: "agent@prime.rw", password: "password", role: "agent", label: "Agent" },
  { email: "officer@prime.rw", password: "password", role: "officer", label: "Claims Officer" },
  { email: "supervisor@prime.rw", password: "password", role: "supervisor", label: "Supervisor" },
  { email: "fraud@prime.rw", password: "password", role: "fraud-investigator", label: "Fraud Investigator" },
  { email: "admin@prime.rw", password: "password", role: "admin", label: "System Administrator" },
  { email: "cyuzuzophoebe@gmail.com", password: "password", role: "admin", label: "Phoebe (Admin)" }
];

export const DEMO_PASSWORD_HINT = "All demo accounts use password: password";
