import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PendingMatch {
  id: string;
  similarityScore: number;
  createdAt: string;
  request?: {
    title: string;
    description: string;
    owner: {
      fname: string;
      id: string;
    };
  };
  group?: {
    name: string;
    description: string;
  };
}

export const usePendingMatches = () => {
  return useQuery({
    queryKey: ['pendingMatches'],
    queryFn: async () => {
      const response = await api.get(UrlConstants.pendingMatches);
      return response.data.data as PendingMatch[];
    },
  });
};

export const useMatchAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ matchId, action }: { matchId: string; action: string }) => {
      const response = await api.post(UrlConstants.fetchMatchDetails(matchId), {
        action: action,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingMatches'] });
    },
  });
};