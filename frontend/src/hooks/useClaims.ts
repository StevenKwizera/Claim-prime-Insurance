import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { backendService, ClaimAction, ClaimSubmissionPayload } from "@/services/backend";
import { filterClaimsForUser } from "@/utils/claimAccess";

export const useClaims = () => {
  const { user } = useAuth();
  const staffRole = user?.role === "officer" || user?.role === "supervisor" || user?.role === "admin";
  return useQuery({
    queryKey: ["claims", user?.id, user?.role],
    queryFn: backendService.listClaims,
    select: (claims) => filterClaimsForUser(claims, user),
    refetchInterval: staffRole ? 15_000 : false,
    refetchOnWindowFocus: true
  });
};

export const useClaim = (claimId: string) => {
  return useQuery({
    queryKey: ["claims", claimId],
    queryFn: () => backendService.getClaim(claimId),
    enabled: Boolean(claimId)
  });
};

export const useAnalytics = () =>
  useQuery({
    queryKey: ["analytics"],
    queryFn: backendService.getAnalytics
  });

export const useNotifications = () =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: backendService.listNotifications
  });

export const useCreateClaim = (mode: "draft" | "submit") => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClaimSubmissionPayload) =>
      mode === "draft" ? backendService.createDraft(payload) : backendService.createClaim(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["claims"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics"] })
      ]);
    }
  });
};

export const useClaimAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      claimId,
      action,
      actor,
      message
    }: {
      claimId: string;
      action: ClaimAction;
      actor: string;
      message?: string;
    }) => backendService.updateClaimAction(claimId, action, actor, message),
    onSuccess: async (claim) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["claims"] }),
        queryClient.invalidateQueries({ queryKey: ["claims", claim.id] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics"] })
      ]);
    }
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => backendService.markNotificationRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; body: string; status?: "Unread" | "Read" | "Action Needed" }) =>
      backendService.createNotification(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
};

export const useAddClaimNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ claimId, note, actor }: { claimId: string; note: string; actor: string }) =>
      backendService.addClaimNote(claimId, note, actor),
    onSuccess: async (claim) => {
      await queryClient.invalidateQueries({ queryKey: ["claims"] });
      await queryClient.invalidateQueries({ queryKey: ["claims", claim.id] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
};

export const useUpdateClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ claimId, payload }: { claimId: string; payload: ClaimSubmissionPayload }) =>
      backendService.updateClaim(claimId, payload),
    onSuccess: async (claim) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["claims"] }),
        queryClient.invalidateQueries({ queryKey: ["claims", claim.id] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
      ]);
    }
  });
};

export const useDeleteClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (claimId: string) => backendService.deleteClaim(claimId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["claims"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics"] })
      ]);
    }
  });
};

export const useUploadEvidence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ claimId, files }: { claimId: string; files: File[] }) => backendService.uploadEvidence(claimId, files),
    onSuccess: async (claim) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["claims"] }),
        queryClient.invalidateQueries({ queryKey: ["claims", claim.id] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
      ]);
    }
  });
};

export const useDeleteEvidence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ claimId, documentId }: { claimId: string; documentId: string }) =>
      backendService.deleteEvidence(claimId, documentId),
    onSuccess: async (claim) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["claims"] }),
        queryClient.invalidateQueries({ queryKey: ["claims", claim.id] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
      ]);
    }
  });
};
