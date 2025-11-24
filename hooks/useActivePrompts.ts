import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ActivePrompt {
  id: string;
  title: string;
  createdAt: string;
}

export const useActivePrompts = () => {
  return useQuery({
    queryKey: ['activePrompts'],
    queryFn: async () => {
      const response = await api.get(UrlConstants.activePrompts);
      return response.data.data as ActivePrompt[];
    },
  });
};

export const useDeleteActivePrompt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(UrlConstants.deleteActivePrompts(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activePrompts'] });
    },
  });
};