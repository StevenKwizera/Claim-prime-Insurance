import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backendService, ClaimantRegistrationPayload, StaffUserPayload } from "@/services/backend";

export const useUsers = (enabled = true) =>
  useQuery({
    queryKey: ["users"],
    queryFn: backendService.listUsers,
    enabled
  });

export const useUserDirectory = () =>
  useQuery({
    queryKey: ["users", "directory"],
    queryFn: backendService.listUserDirectory
  });

export const useRegisterClaimant = () =>
  useMutation({
    mutationFn: (payload: ClaimantRegistrationPayload) => backendService.registerClaimant(payload)
  });

export const useCreateStaffUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StaffUserPayload) => backendService.createStaffUser(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
      ]);
    }
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      phone?: string;
      department?: string;
      region?: string;
      role?: string;
      status?: string;
      mfaEnabled?: boolean;
    }) => backendService.updateUser(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => backendService.deleteUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });
};

export const useAdminResetUserPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, temporaryPassword }: { id: string; temporaryPassword?: string }) =>
      backendService.adminResetUserPassword(id, temporaryPassword),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
      ]);
    }
  });
};

export const useAdminRequestPasswordResetEmail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => backendService.adminRequestPasswordResetEmail(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
};

export const useRequestPasswordReset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => backendService.requestPasswordReset(email),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
};
