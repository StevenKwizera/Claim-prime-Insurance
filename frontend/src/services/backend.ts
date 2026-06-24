import { api } from "@/services/api";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { AnalyticsPoint, Claim, ConversationSummary, DirectMessage, NotificationItem, User, UserRole } from "@/types";
import { analytics as mockAnalytics, demoUsers, mockClaims, mockNotifications } from "@/services/mockData";
import { mockStorageKey, readMockEvidenceBlob, removeMockEvidenceBlob, storeMockEvidenceBlob } from "@/services/evidenceStorage";
import { filterClaimsForUser, userOwnsClaim } from "@/utils/claimAccess";
import { classifyUpload, detectFileKind } from "@/utils/documentAI";
import { applyAssessmentToClaim, assessClaim } from "@/utils/claimAssessment";

export interface ClaimSubmissionPayload {
  claimType: Claim["type"];
  claimantName: string;
  policyNumber: string;
  incidentDate: string;
  description: string;
  files: Array<{ name: string; kind: "image" | "pdf" | "video" | "document" }>;
  /** Actual files to upload after claim is created (API only). */
  fileBlobs?: File[];
}

export type ClaimAction = "approve" | "reject" | "request-info" | "escalate" | "investigate";

interface LoginResponse {
  token: string;
  user: User;
}

interface LoginChallengeResponse {
  requiresOtp: boolean;
  email: string;
  message: string;
  emailSent?: boolean;
  devCode?: string;
}

export type LoginResult =
  | { type: "success"; token: string; user: User }
  | { type: "otp_required"; email: string; message: string; devCode?: string; emailSent?: boolean };

interface PasswordResetResponse {
  message: string;
  emailSent?: boolean;
  devCode?: string;
  resetLink?: string;
  smtpError?: string;
  recipient?: string;
  from?: string;
}

export interface ClaimantRegistrationPayload {
  name: string;
  email: string;
  phone: string;
  nationalIdOrPolicy: string;
  password: string;
  profilePhoto?: string;
}

export interface StaffUserPayload {
  name: string;
  email: string;
  phone: string;
  role: Exclude<UserRole, "claimant">;
  department: string;
  region: string;
  temporaryPassword: string;
}

const storageKey = "prime-insurance-mock-backend-v3";

type StoredDirectMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  relatedClaimId?: string;
  readAt?: string;
  createdAt: string;
};

type StoredState = {
  users: User[];
  claims: Claim[];
  notifications: NotificationItem[];
  directMessages: StoredDirectMessage[];
};

const enrichDirectMessage = (message: StoredDirectMessage, viewerId: string, users: User[]): DirectMessage => {
  const from = users.find((user) => user.id === message.fromUserId);
  const to = users.find((user) => user.id === message.toUserId);
  return {
    id: message.id,
    fromUserId: message.fromUserId,
    fromUserName: from?.name ?? "Unknown",
    toUserId: message.toUserId,
    toUserName: to?.name ?? "Unknown",
    body: message.body,
    relatedClaimId: message.relatedClaimId ?? null,
    readAt: message.readAt ?? null,
    createdAt: message.createdAt,
    mine: message.fromUserId === viewerId
  };
};

const summarizeConversations = (messages: DirectMessage[]): ConversationSummary[] => {
  const byPartner = new Map<string, DirectMessage[]>();
  for (const message of messages) {
    const partnerId = message.mine ? message.toUserId : message.fromUserId;
    const list = byPartner.get(partnerId) ?? [];
    list.push(message);
    byPartner.set(partnerId, list);
  }

  const summaries: ConversationSummary[] = [];
  for (const [userId, thread] of byPartner.entries()) {
    const last = thread[thread.length - 1];
    summaries.push({
      userId,
      userName: last.mine ? last.toUserName : last.fromUserName,
      userRole: "user",
      lastMessage: last.body,
      lastAt: last.createdAt,
      unreadCount: thread.filter((item) => !item.mine && !item.readAt).length
    });
  }

  return summaries.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
};

const normalizeUsers = (users: User[]) =>
  users.map((user) => ((user as unknown as { role: string }).role === "super-admin" ? { ...user, role: "admin" as const } : user));

const loadMockState = (): StoredState => {
  if (typeof window === "undefined") {
    return {
      users: normalizeUsers(demoUsers),
      claims: mockClaims,
      notifications: mockNotifications,
      directMessages: []
    };
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    const seeded: StoredState = {
      users: normalizeUsers(demoUsers),
      claims: mockClaims,
      notifications: mockNotifications,
      directMessages: []
    };
    window.localStorage.setItem(storageKey, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as StoredState;
    return {
      users: normalizeUsers(parsed.users?.length ? parsed.users : demoUsers),
      claims: parsed.claims?.length ? parsed.claims : mockClaims,
      notifications: parsed.notifications?.length ? parsed.notifications : mockNotifications,
      directMessages: parsed.directMessages ?? []
    };
  } catch {
    const seeded: StoredState = {
      users: normalizeUsers(demoUsers),
      claims: mockClaims,
      notifications: mockNotifications,
      directMessages: []
    };
    window.localStorage.setItem(storageKey, JSON.stringify(seeded));
    return seeded;
  }
};

const saveMockState = (next: StoredState) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  }
};

const isNetworkError = (error: unknown) => axios.isAxiosError(error) && !error.response;

const apiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as { message?: string } | undefined;
    if (error.response.status === 403) {
      return data?.message ?? "Access denied. You must be signed in as an administrator.";
    }
    return data?.message ?? fallback;
  }
  if (axios.isAxiosError(error) && !error.response) {
    return "Cannot reach the API. In one terminal run: npm run backend — then refresh and try again.";
  }
  return fallback;
};

const uploadClaimAttachments = async (claimId: string, blobs: File[]) => {
  if (!blobs.length) {
    return;
  }
  const form = new FormData();
  blobs.forEach((file) => form.append("files", file));
  await api.post<Claim>(`/claims/${claimId}/attachments`, form);
};

export const fetchEvidenceBlob = async (claimId: string, documentId: string) => {
  try {
    const { data } = await api.get<Blob>(`/claims/${claimId}/attachments/${documentId}/download`, {
      responseType: "blob"
    });
    if (data.size > 0) {
      return data;
    }
  } catch {
    // fall through to mock/offline store
  }
  const mock = readMockEvidenceBlob(claimId, documentId);
  if (mock) {
    return mock;
  }
  throw new Error("Evidence file not found");
};

const buildStoredDocument = (file: File, claimId: string, docId: string, uploadedAt: string): Claim["documents"][number] => {
  const kind = detectFileKind(file);
  const classified = classifyUpload(file.name, kind);
  return {
    id: docId,
    name: file.name,
    kind,
    aiStatus: classified.aiStatus,
    uploadedAt,
    version: 1,
    tag: "stored",
    documentType: classified.documentType === "Unclassified" ? undefined : classified.documentType,
    confidenceScore: classified.confidenceScore,
    reviewNote: classified.reviewNote,
    storageKey: mockStorageKey(claimId, docId),
    sizeBytes: file.size
  };
};

/** Persist uploaded files in browser storage so image previews work offline/mock. */
const attachMockFileBlobs = async (
  claim: Claim,
  fileBlobs: File[],
  mode: "fill" | "append" = "fill"
): Promise<Claim> => {
  if (!fileBlobs.length) {
    return claim;
  }
  const now = new Date().toISOString();
  const documents = [...claim.documents];
  for (let index = 0; index < fileBlobs.length; index += 1) {
    const file = fileBlobs[index];
    const placeholderIdx =
      mode === "fill"
        ? documents.findIndex(
            (doc) => doc.name.toLowerCase() === file.name.toLowerCase() && !doc.storageKey
          )
        : -1;
    const docId =
      placeholderIdx >= 0
        ? documents[placeholderIdx].id
        : `d-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`;
    await storeMockEvidenceBlob(claim.id, docId, file);
    const stored = buildStoredDocument(file, claim.id, docId, now);
    if (placeholderIdx >= 0) {
      documents[placeholderIdx] = { ...documents[placeholderIdx], ...stored, id: docId };
    } else {
      documents.push(stored);
    }
  }
  return { ...claim, documents };
};

export const downloadStoredEvidence = async (claimId: string, documentId: string, filename: string) => {
  const data = await fetchEvidenceBlob(claimId, documentId);
  const url = URL.createObjectURL(data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename || "evidence";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
};

const assignTeam = (claimType: Claim["type"], riskScore: number) => {
  if (riskScore >= 55) return "Fraud Investigation Team";
  if (claimType === "health") return "Health Claims Unit";
  if (claimType === "property") return "Property Claims Unit";
  return "Motor Claims Unit";
};

const assignOfficerName = (team: string) => {
  if (team === "Fraud Investigation Team") return "Fabrice Iradukunda";
  if (team === "Health Claims Unit") return "Daniel Mugisha";
  if (team === "Property Claims Unit") return "Alice Mukandayisenga";
  return "Grace Uwase";
};

export const backendService = {
  async login(input: { email: string; password: string }): Promise<LoginResult> {
    try {
      const { data } = await api.post<LoginResponse | LoginChallengeResponse>("/auth/login", input);
      if ("requiresOtp" in data && data.requiresOtp) {
        return {
          type: "otp_required",
          email: data.email,
          message: data.message,
          devCode: data.devCode,
          emailSent: data.emailSent
        };
      }
      const success = data as LoginResponse;
      return { type: "success", token: success.token, user: success.user };
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Login failed. Check your email and password, then restart the backend if you just added a new user."));
    }
  },
  async verifyLoginOtp(input: { email: string; password: string; code: string }) {
    try {
      const { data } = await api.post<LoginResponse>("/auth/login/verify-otp", input);
      return data;
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Invalid verification code."));
    }
  },
  async sendOtp(email: string, purpose: "registration" | "login" | "password-reset") {
    try {
      const { data } = await api.post<{ message: string; devCode?: string; emailSent?: boolean }>(
        "/auth/otp/send",
        { email, purpose }
      );
      return data;
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Could not send verification email."));
    }
  },
  async verifyOtp(email: string, code: string, purpose: "registration" | "login" | "password-reset") {
    try {
      const { data } = await api.post<{ message: string }>("/auth/otp/verify", { email, code, purpose });
      return data;
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Invalid verification code."));
    }
  },
  async listDemoAccounts() {
    const { data } = await api.get<Array<{ email: string; name: string; role: UserRole }>>("/auth/demo-accounts");
    return data;
  },
  async registerClaimant(payload: ClaimantRegistrationPayload) {
    try {
      const { data } = await api.post<{ user: User; message?: string; warning?: string; devCode?: string }>(
        "/auth/register",
        payload
      );
      return data;
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Unable to register claimant in the database."));
    }
  },
  async createStaffUser(payload: StaffUserPayload) {
    try {
      const { data } = await api.post<User>("/users", payload);
      return data;
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Unable to create staff user in the database."));
    }
  },
  async requestPasswordReset(email: string) {
    try {
      const { data } = await api.post<PasswordResetResponse>("/auth/password-reset/request", { email });
      return data;
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Unable to send password reset link."));
    }
  },
  async resetPassword(input: { email: string; code: string; password: string }) {
    try {
      const { data } = await api.post<{ message: string }>("/auth/password-reset/confirm", input);
      return data;
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Password reset failed."));
    }
  },
  async listUsers() {
    try {
      const { data } = await api.get<User[]>("/users");
      return data;
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Unable to load users from the database."));
    }
  },
  async listClaims() {
    try {
      const { data } = await api.get<Claim[]>("/claims");
      const state = loadMockState();
      saveMockState({ ...state, claims: data });
      return data;
    } catch (error) {
      if (!isNetworkError(error)) {
        throw new Error(apiErrorMessage(error, "Unable to load claims from the server."));
      }
      const user = useAuthStore.getState().user;
      return filterClaimsForUser(loadMockState().claims.map(applyAssessmentToClaim), user);
    }
  },
  async listUserDirectory() {
    try {
      const { data } = await api.get<User[]>("/users/directory");
      return data;
    } catch (error) {
      if (!isNetworkError(error)) {
        throw new Error(apiErrorMessage(error, "Unable to load users from the server."));
      }
      return normalizeUsers(demoUsers);
    }
  },
  async getClaim(id: string) {
    try {
      const { data } = await api.get<Claim>(`/claims/${id}`);
      return data;
    } catch (error) {
      if (!isNetworkError(error)) {
        throw new Error(apiErrorMessage(error, "Unable to load this claim."));
      }
      const user = useAuthStore.getState().user;
      const state = loadMockState();
      const claim = state.claims.find((item) => item.id === id);
      if (!claim) {
        throw new Error("Claim not found");
      }
      if (!userOwnsClaim(claim, user)) {
        throw new Error("Claim not found");
      }
      return applyAssessmentToClaim(claim);
    }
  },
  async updateClaim(claimId: string, payload: ClaimSubmissionPayload) {
    const { fileBlobs = [], ...rest } = payload;
    try {
      const { data } = await api.put<Claim>(`/claims/${claimId}`, rest);
      await uploadClaimAttachments(claimId, fileBlobs);
      if (fileBlobs.length) {
        const { data: refreshed } = await api.get<Claim>(`/claims/${claimId}`);
        return refreshed;
      }
      return data;
    } catch (error) {
      if (!isNetworkError(error)) {
        throw new Error(apiErrorMessage(error, "Unable to update this claim."));
      }
      const user = useAuthStore.getState().user;
      const state = loadMockState();
      const current = state.claims.find((item) => item.id === claimId);
      if (!current || !userOwnsClaim(current, user)) {
        throw new Error("Claim not found");
      }
      if (!["Draft", "Pending", "Under Review"].includes(current.status)) {
        throw new Error("This claim can no longer be edited.");
      }
      const now = new Date().toISOString();
      const mergedDocs = [
        ...current.documents,
        ...payload.files
          .filter((f) => !current.documents.some((d) => d.name.toLowerCase() === f.name.toLowerCase()))
          .map((file, index) => ({
            id: `d-${Date.now()}-${index}`,
            name: file.name,
            kind: file.kind,
            aiStatus: "Missing" as const,
            uploadedAt: now,
            version: 1,
            tag: "uploaded"
          }))
      ];
      const updated: Claim = {
        ...current,
        policyNumber: payload.policyNumber,
        type: payload.claimType,
        aiSummary: payload.description || current.aiSummary,
        documents: mergedDocs,
        timeline: [
          ...current.timeline,
          {
            id: `t-${Date.now()}`,
            label: "Claim details updated by claimant",
            at: now,
            actor: current.claimantName,
            tone: "neutral"
          }
        ]
      };
      const withFiles = await attachMockFileBlobs(updated, fileBlobs);
      saveMockState({
        ...state,
        claims: state.claims.map((item) => (item.id === claimId ? withFiles : item))
      });
      return withFiles;
    }
  },
  async deleteClaim(claimId: string) {
    try {
      await api.delete(`/claims/${claimId}`);
      return { claimId };
    } catch {
      const user = useAuthStore.getState().user;
      const state = loadMockState();
      const current = state.claims.find((item) => item.id === claimId);
      if (!current || !userOwnsClaim(current, user)) {
        throw new Error("Claim not found");
      }
      if (!["Draft", "Pending", "Under Review", "Rejected"].includes(current.status)) {
        throw new Error("This claim cannot be deleted.");
      }
      saveMockState({
        ...state,
        claims: state.claims.filter((item) => item.id !== claimId)
      });
      return { claimId };
    }
  },
  async createDraft(payload: ClaimSubmissionPayload) {
    const { fileBlobs = [], ...rest } = payload;
    try {
      const { data } = await api.post<Claim>("/claims/draft", rest);
      if (fileBlobs.length) {
        await uploadClaimAttachments(data.id, fileBlobs);
        const { data: refreshed } = await api.get<Claim>(`/claims/${data.id}`);
        return refreshed;
      }
      return data;
    } catch {
      const state = loadMockState();
      const now = new Date().toISOString();
      const team = assignTeam(payload.claimType, 12);
      const claim: Claim = {
        id: `CLM-${Math.floor(10000 + Math.random() * 89999)}`,
        claimantName: payload.claimantName,
        policyNumber: payload.policyNumber,
        type: payload.claimType,
        status: "Draft",
        region: "Kigali",
        submittedAt: now,
        estimatedCompletion: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        riskScore: 12,
        aiSummary: "Draft saved. Upload documents to enable AI intake checks.",
        assignedTeam: team,
        assignedOfficer: assignOfficerName(team),
        documents: payload.files.map((file, index) => ({
          id: `d-${Date.now()}-${index}`,
          name: file.name,
          kind: file.kind,
          aiStatus: "Missing",
          uploadedAt: now,
          version: 1,
          tag: "draft"
        })),
        timeline: [{ id: `t-${Date.now()}`, label: "Claim started as draft", at: now, actor: payload.claimantName, tone: "neutral" }]
      };

      const withFiles = await attachMockFileBlobs(claim, fileBlobs);
      const next = { ...state, claims: [withFiles, ...state.claims] };
      saveMockState(next);
      return withFiles;
    }
  },
  async createClaim(payload: ClaimSubmissionPayload) {
    const { fileBlobs = [], ...rest } = payload;
    try {
      const { data } = await api.post<Claim>("/claims", rest);
      if (fileBlobs.length) {
        await uploadClaimAttachments(data.id, fileBlobs);
        const { data: refreshed } = await api.get<Claim>(`/claims/${data.id}`);
        return refreshed;
      }
      return data;
    } catch (error) {
      if (!isNetworkError(error)) {
        throw new Error(
          apiErrorMessage(
            error,
            "Claim submission failed. Sign in again and run npm run backend so the claim is saved for officers."
          )
        );
      }
      const state = loadMockState();
      const now = new Date().toISOString();
      const documents = payload.files.map((file, index) => {
        const classified = classifyUpload(file.name, file.kind);
        return {
          id: `d-${Date.now()}-${index}`,
          name: file.name,
          kind: file.kind,
          aiStatus: classified.aiStatus,
          uploadedAt: now,
          version: 1,
          tag: classified.documentType ?? "upload",
          documentType: classified.documentType === "Unclassified" ? undefined : classified.documentType,
          confidenceScore: classified.confidenceScore,
          reviewNote: classified.reviewNote
        };
      });

      const assessment = assessClaim({
        type: payload.claimType,
        status: "Under Review",
        documents
      });
      const team = assignTeam(payload.claimType, assessment.fraudRiskScore);

      const claim: Claim = applyAssessmentToClaim({
        id: `CLM-${Math.floor(10000 + Math.random() * 89999)}`,
        claimantName: payload.claimantName,
        policyNumber: payload.policyNumber,
        type: payload.claimType,
        status: "Under Review",
        region: "Kigali",
        submittedAt: now,
        estimatedCompletion: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        riskScore: assessment.fraudRiskScore,
        aiSummary: assessment.summary,
        assignedTeam: team,
        assignedOfficer: assignOfficerName(team),
        documents,
        timeline: [
          { id: `t-${Date.now()}-1`, label: "Claim submitted", at: now, actor: payload.claimantName, tone: "success" },
          {
            id: `t-${Date.now()}-2`,
            label: "AI document analysis completed (OCR & validation)",
            at: now,
            actor: "AI System",
            tone: "neutral"
          },
          {
            id: `t-${Date.now()}-3`,
            label: `AI fraud detection — risk score ${assessment.fraudRiskScore}/100`,
            at: now,
            actor: "AI System",
            tone: assessment.fraudRiskScore >= 60 ? "danger" : "warning"
          },
          { id: `t-${Date.now()}-4`, label: "Routed to officer · Under Review", at: now, actor: "System", tone: "success" }
        ]
      });

      const nextNotifications: NotificationItem[] = [
        {
          id: `n-${Date.now()}-a`,
          title: "Claim submitted",
          body: `Your claim ${claim.id} was submitted and routed to ${claim.assignedTeam}.`,
          status: "Unread",
          at: now
        },
        {
          id: `n-${Date.now()}-b`,
          title: "Your claim is being reviewed by an officer.",
          body: `${claim.id}: AI checks complete. Status is Under Review.`,
          status: "Unread",
          at: now
        },
        {
          id: `n-${Date.now()}-off`,
          title: "New claim in review queue",
          body: `${claim.id} from ${claim.claimantName} is ready for officer review.`,
          status: "Unread",
          at: now
        },
        ...state.notifications
      ];

      const withFiles = await attachMockFileBlobs(claim, fileBlobs);
      saveMockState({ ...state, claims: [withFiles, ...state.claims], notifications: nextNotifications });
      return withFiles;
    }
  },
  async updateClaimAction(claimId: string, action: ClaimAction, actor: string, message?: string) {
    try {
      const { data } = await api.patch<Claim>(`/claims/${claimId}/action`, { action, actor, message: message ?? null });
      return data;
    } catch (error) {
      if (!isNetworkError(error)) {
        throw new Error(apiErrorMessage(error, "Could not update the claim. Sign in as officer and try again."));
      }
      const state = loadMockState();
      const current = state.claims.find((item) => item.id === claimId);
      if (!current) throw new Error("Claim not found");

      const nextStatus: Claim["status"] =
        action === "approve"
          ? "Approved"
          : action === "reject"
            ? "Rejected"
            : action === "investigate"
              ? "Investigation"
              : action === "request-info"
                ? "Under Review"
                : "Under Review";

      const now = new Date().toISOString();
      const updated: Claim = {
        ...current,
        status: nextStatus,
        timeline: [
          ...current.timeline,
          {
            id: `t-${Date.now()}`,
            label:
              action === "approve"
                ? "Approved"
                : action === "reject"
                  ? "Rejected"
                  : action === "investigate"
                    ? "Investigation started"
                    : action === "request-info"
                      ? "More information requested"
                      : "Escalated",
            at: now,
            actor,
            tone: action === "approve" ? "success" : action === "reject" ? "danger" : action === "investigate" ? "warning" : "neutral"
          }
        ]
      };

      const nextNotifications = [...state.notifications];
      if (action === "request-info") {
        nextNotifications.unshift({
          id: `n-${Date.now()}`,
          title: "Additional information required",
          body: `${claimId}: Upload photos or PDFs on Evidence upload.`,
          status: "Action Needed",
          at: now
        });
      }
      if (action === "approve") {
        nextNotifications.unshift({
          id: `n-${Date.now()}-ap`,
          title: "Your claim has been approved.",
          body: `${claimId} has been approved.`,
          status: "Unread",
          at: now
        });
      }

      const nextClaims = state.claims.map((item) => (item.id === claimId ? updated : item));
      saveMockState({ ...state, claims: nextClaims, notifications: nextNotifications });
      return updated;
    }
  },
  async uploadEvidence(claimId: string, files: File[]) {
    try {
      const form = new FormData();
      files.forEach((file) => form.append("files", file));
      const { data } = await api.post<Claim>(`/claims/${claimId}/attachments`, form);
      return data;
    } catch {
      const state = loadMockState();
      const current = state.claims.find((item) => item.id === claimId);
      if (!current) throw new Error("Claim not found");

      let updated: Claim = {
        ...current,
        documents: [...current.documents],
        timeline: current.timeline
      };
      updated = await attachMockFileBlobs(updated, files, "append");
      const now = new Date().toISOString();
      updated = {
        ...updated,
        timeline: [
          ...updated.timeline,
          {
            id: `t-${Date.now()}`,
            label: files.length === 1 ? "Claimant uploaded additional evidence" : `Claimant uploaded ${files.length} evidence files`,
            at: now,
            actor: current.claimantName,
            tone: "success"
          }
        ]
      };

      const nextNotifications: NotificationItem[] = [
        {
          id: `n-${Date.now()}`,
          title: "Evidence uploaded",
          body: `${files.length} file(s) were attached to ${claimId}.`,
          status: "Unread",
          at: now
        },
        ...state.notifications
      ];

      saveMockState({
        ...state,
        claims: state.claims.map((item) => (item.id === claimId ? updated : item)),
        notifications: nextNotifications
      });
      return updated;
    }
  },
  async deleteEvidence(claimId: string, documentId: string) {
    try {
      const { data } = await api.delete<Claim>(`/claims/${claimId}/attachments/${documentId}`);
      const state = loadMockState();
      saveMockState({
        ...state,
        claims: state.claims.some((item) => item.id === claimId)
          ? state.claims.map((item) => (item.id === claimId ? data : item))
          : [...state.claims, data]
      });
      removeMockEvidenceBlob(claimId, documentId);
      return data;
    } catch (error) {
      if (!isNetworkError(error)) {
        throw new Error(
          apiErrorMessage(
            error,
            "Could not remove this file. Refresh the page and try again — if it persists, restart the backend (npm run backend)."
          )
        );
      }
      const state = loadMockState();
      const current = state.claims.find((item) => item.id === claimId);
      if (!current) {
        throw new Error("Claim not found");
      }
      const target = current.documents.find((doc) => doc.id === documentId);
      if (!target) {
        throw new Error("Attachment not found");
      }
      removeMockEvidenceBlob(claimId, documentId);
      const now = new Date().toISOString();
      const updated: Claim = {
        ...current,
        documents: current.documents.filter((doc) => doc.id !== documentId),
        timeline: [
          ...current.timeline,
          {
            id: `t-${Date.now()}`,
            label: `Evidence removed: ${target.name}`,
            at: now,
            actor: current.claimantName,
            tone: "neutral"
          }
        ]
      };
      saveMockState({
        ...state,
        claims: state.claims.map((item) => (item.id === claimId ? updated : item))
      });
      return updated;
    }
  },
  async listNotifications() {
    try {
      const { data } = await api.get<NotificationItem[]>("/notifications");
      return data;
    } catch {
      return loadMockState().notifications;
    }
  },
  async markNotificationRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
  },
  async createNotification(input: { title: string; body: string; status?: NotificationItem["status"] }) {
    const { data } = await api.post<NotificationItem>("/notifications", input);
    return data;
  },
  async listMessageContacts() {
    try {
      const { data } = await api.get<User[]>("/messages/contacts");
      return data;
    } catch (error) {
      if (!isNetworkError(error)) {
        throw new Error(apiErrorMessage(error, "Unable to load contacts."));
      }
      const me = useAuthStore.getState().user;
      if (!me) {
        return [];
      }
      return loadMockState().users.filter((user) => user.id !== me.id && user.status !== "Inactive");
    }
  },
  async listMessageConversations() {
    try {
      const { data } = await api.get<ConversationSummary[]>("/messages/conversations");
      return data;
    } catch (error) {
      if (!isNetworkError(error)) {
        throw new Error(apiErrorMessage(error, "Unable to load conversations."));
      }
      const me = useAuthStore.getState().user;
      if (!me) {
        return [];
      }
      const state = loadMockState();
      const messages = state.directMessages
        .filter((item) => item.fromUserId === me.id || item.toUserId === me.id)
        .map((item) => enrichDirectMessage(item, me.id, state.users));
      return summarizeConversations(messages);
    }
  },
  async getMessageThread(otherUserId: string) {
    try {
      const { data } = await api.get<DirectMessage[]>(`/messages/with/${otherUserId}`);
      return data;
    } catch (error) {
      if (!isNetworkError(error)) {
        throw new Error(apiErrorMessage(error, "Unable to load messages."));
      }
      const me = useAuthStore.getState().user;
      if (!me) {
        return [];
      }
      const state = loadMockState();
      const thread = state.directMessages
        .filter(
          (item) =>
            (item.fromUserId === me.id && item.toUserId === otherUserId) ||
            (item.fromUserId === otherUserId && item.toUserId === me.id)
        )
        .map((item) => enrichDirectMessage(item, me.id, state.users));
      const nextMessages = state.directMessages.map((item) =>
        item.fromUserId === otherUserId && item.toUserId === me.id && !item.readAt
          ? { ...item, readAt: new Date().toISOString() }
          : item
      );
      saveMockState({ ...state, directMessages: nextMessages });
      return thread;
    }
  },
  async sendDirectMessage(input: { toUserId: string; body: string; relatedClaimId?: string }) {
    try {
      const { data } = await api.post<DirectMessage>("/messages", input);
      return data;
    } catch (error) {
      if (!isNetworkError(error)) {
        throw new Error(apiErrorMessage(error, "Could not send message."));
      }
      const me = useAuthStore.getState().user;
      if (!me) {
        throw new Error("You must be signed in to send messages.");
      }
      const state = loadMockState();
      const createdAt = new Date().toISOString();
      const stored: StoredDirectMessage = {
        id: `dm-${crypto.randomUUID()}`,
        fromUserId: me.id,
        toUserId: input.toUserId,
        body: input.body.trim(),
        relatedClaimId: input.relatedClaimId,
        createdAt
      };
      saveMockState({ ...state, directMessages: [...state.directMessages, stored] });
      return enrichDirectMessage(stored, me.id, state.users);
    }
  },
  async addClaimNote(claimId: string, note: string, actor: string) {
    const { data } = await api.post<Claim>(`/claims/${claimId}/notes`, { note, actor });
    return data;
  },
  async updateUser(
    id: string,
    input: {
      name?: string;
      phone?: string;
      department?: string;
      region?: string;
      role?: string;
      status?: string;
      mfaEnabled?: boolean;
    }
  ) {
    try {
      const { data } = await api.patch<User>(`/users/${id}`, input);
      return data;
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Could not update user."));
    }
  },
  async deleteUser(id: string) {
    try {
      const { data } = await api.delete<{ message: string }>(`/users/${id}`);
      return data;
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Could not delete user."));
    }
  },
  async adminResetUserPassword(id: string, temporaryPassword?: string) {
    try {
      const { data } = await api.post<{ message: string; emailSent?: boolean; temporaryPassword?: string }>(
        `/users/${id}/reset-password`,
        { temporaryPassword: temporaryPassword ?? undefined }
      );
      return data;
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Could not reset password."));
    }
  },
  async adminRequestPasswordResetEmail(id: string) {
    try {
      const { data } = await api.post<{
        message: string;
        emailSent?: boolean;
        devCode?: string;
        resetLink?: string;
      }>(`/users/${id}/request-reset-email`);
      return data;
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Could not send reset email."));
    }
  },
  async getAnalytics() {
    try {
      const { data } = await api.get<AnalyticsPoint[]>("/analytics");
      return data;
    } catch {
      return mockAnalytics;
    }
  }
};
