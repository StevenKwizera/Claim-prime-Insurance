import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backendService } from "@/services/backend";

export const useMessageContacts = () =>
  useQuery({
    queryKey: ["messages", "contacts"],
    queryFn: backendService.listMessageContacts
  });

export const useMessageConversations = () =>
  useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: backendService.listMessageConversations,
    refetchInterval: 15000
  });

export const useMessageThread = (otherUserId: string | null) =>
  useQuery({
    queryKey: ["messages", "thread", otherUserId],
    queryFn: () => backendService.getMessageThread(otherUserId!),
    enabled: Boolean(otherUserId)
  });

export const useSendDirectMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { toUserId: string; body: string; relatedClaimId?: string }) =>
      backendService.sendDirectMessage(input),
    onSuccess: async (_message, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] }),
        queryClient.invalidateQueries({ queryKey: ["messages", "thread", variables.toUserId] })
      ]);
    }
  });
};
