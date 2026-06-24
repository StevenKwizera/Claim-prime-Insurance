import { AnalyticsPoint, NotificationItem, User } from "@/types";
import { seedClaims } from "@/services/seedClaims";

export const demoUsers: User[] = [
  { id: "u1", name: "Aline Mukamana", email: "claimant@prime.rw", role: "claimant", region: "Kigali" },
  { id: "u-jean-c", name: "Jean Mukamana", email: "jean@prime.rw", role: "claimant", region: "Kigali" },
  { id: "u2", name: "Jean Niyonzima", email: "agent@prime.rw", role: "agent", region: "Southern" },
  { id: "u3", name: "Grace Uwase", email: "officer@prime.rw", role: "officer", region: "Kigali" },
  { id: "u4", name: "David Habineza", email: "supervisor@prime.rw", role: "supervisor", region: "Eastern" },
  { id: "u5", name: "Admin User", email: "admin@prime.rw", role: "admin", region: "HQ" },
  { id: "u6", name: "Fabrice Iradukunda", email: "fraud@prime.rw", role: "fraud-investigator", region: "HQ" }
];

export const mockClaims = seedClaims;

export const mockNotifications: NotificationItem[] = [
  { id: "n1", title: "Additional receipt needed", body: "Upload the garage receipt for CLM-24091.", status: "Action Needed", at: "2026-04-23T09:00:00Z" },
  { id: "n2", title: "Claim approved", body: "Health claim CLM-24088 has been approved.", status: "Unread", at: "2026-04-24T11:20:00Z" },
  { id: "n3", title: "Compliance reminder", body: "Quarterly fraud report export is due today.", status: "Read", at: "2026-04-25T07:30:00Z" }
];

export const analytics: AnalyticsPoint[] = [
  { label: "Jan", claims: 120, approved: 91, avgDays: 8 },
  { label: "Feb", claims: 146, approved: 108, avgDays: 7 },
  { label: "Mar", claims: 170, approved: 127, avgDays: 6 },
  { label: "Apr", claims: 192, approved: 148, avgDays: 5 },
  { label: "May", claims: 218, approved: 162, avgDays: 5 },
  { label: "Jun", claims: 241, approved: 178, avgDays: 4 }
];
