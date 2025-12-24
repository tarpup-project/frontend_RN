import { useCallback, useEffect, useState } from 'react';
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

export const usePrompts = (params?: UsePromptsParams) => {
  const { user } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setError(null);
    try {
      const data = await PromptsAPI.fetchCategories();
      setCategories(data);
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err).message;
      setError(errorMessage);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  const fetchPrompts = useCallback(async () => {
    console.log('Fetching prompts with params:', {
      campusID: params?.campusID,
      stateID: params?.stateID,
      categoryID: params?.selectedCategory?.id,
      userID: user?.id,
    });

    setIsLoadingPrompts(true);
    setError(null);
    try {
      const data = await PromptsAPI.fetchPrompts({
        campusID: params?.campusID,
        stateID: params?.stateID,
        categoryID: params?.selectedCategory?.id,
        userID: user?.id,
      });
      setPrompts(data.requests);
      setLastUpdated(new Date(data.sentAt));
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err).message;
      setError(errorMessage);
    } finally {
      setIsLoadingPrompts(false);
    }
  }, [params?.campusID, params?.stateID, params?.selectedCategory, user?.id]);

  const submitRequest = async (requestID: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await PromptsAPI.submitRequest(requestID);
      await fetchPrompts();
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
      await fetchPrompts();
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
      await fetchPrompts(); // Reload the prompts after reporting
      return true;
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err).message;
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchPrompts();
  }, [params?.campusID, params?.stateID, params?.selectedCategory?.id]);

  useEffect(() => {
    if (params?.autoRefresh) {
      const interval = setInterval(() => {
        fetchPrompts();
      }, params?.refreshInterval || 15000);

      return () => clearInterval(interval);
    }
  }, [params?.autoRefresh, params?.refreshInterval]);

  return {
    categories,
    prompts,
    lastUpdated,
    isLoadingCategories,
    isLoadingPrompts,
    isSubmitting,
    isLoading: isLoadingCategories || isLoadingPrompts,
    error,
    clearError: () => setError(null),
    fetchCategories,
    fetchPrompts,
    submitRequest,
    joinPublicGroup,
    reportPrompt,
    refresh: fetchPrompts,
  };
};
