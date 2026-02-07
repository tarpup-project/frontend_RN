import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const usePostComments = (imageId: string | null, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['post', 'comments', imageId],
        queryFn: async () => {
            if (!imageId) return [];
            const res = await api.get(UrlConstants.tarpPostComments(imageId));
            return (res as any)?.data?.data ?? (res as any)?.data?.comments ?? (res as any)?.data ?? [];
        },
        enabled: !!imageId && enabled,
        staleTime: 0, // Always consider stale to allow background refresh
        refetchOnMount: 'always', // Always refetch when component mounts (or query becomes enabled)
    });
};

export const useAddPostComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ imageId, message, replyingToID }: { imageId: string, message: string, replyingToID?: string | null }) => {
            const body = { message, ...(replyingToID ? { replyingToID } : {}) };
            const res = await api.post(UrlConstants.tarpPostComments(imageId), body);
            return res.data;
        },
        onMutate: async ({ imageId, message, replyingToID }) => {
            await queryClient.cancelQueries({ queryKey: ['post', 'comments', imageId] });

            const previousComments = queryClient.getQueryData(['post', 'comments', imageId]);

            // Optimistic update
            queryClient.setQueryData(['post', 'comments', imageId], (old: any[] | undefined) => {
                const newComment = {
                    id: `temp-${Date.now()}`,
                    message,
                    createdAt: new Date().toISOString(),
                    // You might need to add user data here if available, or just partial data
                    // For now, minimal optimistic data
                    replyingToID: replyingToID || null,
                    // We don't have user info readily available here without passing it in or using auth store
                    // But the UI might need it. 
                };
                return old ? [...old, newComment] : [newComment];
            });

            return { previousComments };
        },
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(['post', 'comments', newTodo.imageId], context?.previousComments);
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: ['post', 'comments', variables.imageId] });
        },
    });
};
