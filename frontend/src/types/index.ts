export type UserRole =
  | "claimant"
  | "agent"
  | "officer"
  | "supervisor"
  | "admin"
  | "fraud-investigator";

export type ClaimType = "auto" | "health" | "property";
export type ClaimStatus =
  | "Draft"
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Investigation";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  region: string;
  phone?: string;
  department?: string;
  status?: "Active" | "Pending" | "Inactive" | "Suspended" | "Locked";
  mfaEnabled?: boolean;
  lastLoginAt?: string;
  profilePhoto?: string;
}

export type EvidenceKind = "image" | "pdf" | "video" | "document";

export interface ClaimDocument {
  id: string;
  name: string;
  kind: EvidenceKind;
  aiStatus: "Valid" | "Flagged" | "Missing";
  uploadedAt: string;
  version: number;
  tag: string;
  documentType?: string;
  confidenceScore?: number;
  reviewNote?: string;
  /** Server-relative path when binary is stored on disk */
  storageKey?: string | null;
  sizeBytes?: number | null;
  /** Demo/seed preview URL (picsum, sample video, etc.) */
  previewUrl?: string;
}

export interface TimelineEntry {
  id: string;
  label: string;
  at: string;
  actor: string;
  tone: "neutral" | "success" | "danger" | "warning";
}

export interface Claim {
  id: string;
  claimantName: string;
  policyNumber: string;
  type: ClaimType;
  status: ClaimStatus;
  region: string;
  submittedAt: string;
  estimatedCompletion: string;
  riskScore: number;
  aiSummary: string;
  assignedTeam: string;
  assignedOfficer: string;
  documents: ClaimDocument[];
  timeline: TimelineEntry[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  status: "Unread" | "Read" | "Action Needed";
  at: string;
}

export interface DirectMessage {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  body: string;
  relatedClaimId?: string | null;
  readAt?: string | null;
  createdAt: string;
  mine: boolean;
}

export interface ConversationSummary {
  userId: string;
  userName: string;
  userRole: string;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
}

export interface AnalyticsPoint {
  label: string;
  claims: number;
  approved: number;
  avgDays: number;
}
