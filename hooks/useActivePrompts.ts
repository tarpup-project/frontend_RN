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
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['activePrompts'] });
      const previous = queryClient.getQueryData<ActivePrompt[]>(['activePrompts']);
      queryClient.setQueryData<ActivePrompt[]>(['activePrompts'], (old) =>
        (old || []).filter((p) => p.id === id ? false : true)
      );
      return { previous } as { previous?: ActivePrompt[] };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['activePrompts'], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['activePrompts'] });
    },
  });
};
