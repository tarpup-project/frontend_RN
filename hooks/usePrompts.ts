import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { PromptsAPI } from '../api/endpoints/prompts';
import { useAuthStore } from '../state/authStore';
import { Category, FilterType, Prompt } from '../types/prompts';
import { ErrorHandler } from '../utils/errorHandler';

interface UsePromptsParams {
  campusID?: string;
  stateID?: string;
  selectedCategory?: FilterType;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Query keys for React Query
const promptsKeys = {
  all: ['prompts'] as const,
  categories: () => [...promptsKeys.all, 'categories'] as const,
  lists: () => [...promptsKeys.all, 'list'] as const,
  list: (params: { campusID?: string; stateID?: string; categoryID?: string; userID?: string }) => 
    [...promptsKeys.lists(), params] as const,
};

const fetchCategories = async (): Promise<Category[]> => {
  try {
    const data = await PromptsAPI.fetchCategories();
    return data;
  } catch (error) {
    throw error;
  }
};

const fetchPrompts = async (params: {
  campusID?: string;
  stateID?: string;
  categoryID?: string;
  userID?: string;
}) => {
  try {
    console.log('🔄 Fetching prompts with params:', params);
    const data = await PromptsAPI.fetchPrompts(params);
    return data;
  } catch (error) {
    throw error;
  }
};

export const usePrompts = (params?: UsePromptsParams) => {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories with React Query
  const categoriesQuery = useQuery({
    queryKey: promptsKeys.categories(),
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 3,
    placeholderData: (previousData) => previousData,
  });

  // Fetch prompts with React Query
  const promptsQuery = useQuery({
    queryKey: promptsKeys.list({
      campusID: params?.campusID,
      stateID: params?.stateID,
      categoryID: params?.selectedCategory?.id,
      userID: user?.id,
    }),
    queryFn: () => fetchPrompts({
      campusID: params?.campusID,
      stateID: params?.stateID,
      categoryID: params?.selectedCategory?.id,
      userID: user?.id,
    }),
    staleTime: 1000 * 60 * 1, // 1 minute (prompts are live)
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 3,
    refetchInterval: params?.autoRefresh ? (params?.refreshInterval || 15000) : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
    enabled: !!user?.id, // Only fetch when user is available
  });

  const submitRequest = async (requestID: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await PromptsAPI.submitRequest(requestID);
      
      // Invalidate and refetch prompts
      promptsQuery.refetch();
      
      return true;
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err).message;
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const joinPublicGroup = async (groupID: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await PromptsAPI.joinPublicGroup(groupID);
      
      // Invalidate and refetch prompts
      promptsQuery.refetch();
      
      return true;
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err).message;
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const reportPrompt = async (promptID: string) => {
    setError(null);
    try {
      await PromptsAPI.reportPrompt(promptID);
      
      // Invalidate and refetch prompts
      promptsQuery.refetch();
      
      return true;
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err).message;
      setError(errorMessage);
      throw err;
    }
  };

  const refresh = useCallback(() => {
    categoriesQuery.refetch();
    promptsQuery.refetch();
  }, [categoriesQuery, promptsQuery]);

  return {
    categories: categoriesQuery.data || [],
    prompts: promptsQuery.data?.requests || [],
    lastUpdated: promptsQuery.data?.sentAt ? new Date(promptsQuery.data.sentAt) : null,
    isLoadingCategories: categoriesQuery.isLoading,
    isLoadingPrompts: promptsQuery.isLoading,
    isSubmitting,
    isLoading: categoriesQuery.isLoading || promptsQuery.isLoading,
    error: error || categoriesQuery.error?.message || promptsQuery.error?.message || null,
    clearError: () => setError(null),
    fetchCategories: categoriesQuery.refetch,
    fetchPrompts: promptsQuery.refetch,
    submitRequest,
    joinPublicGroup,
    reportPrompt,
    refresh,
  };
};
