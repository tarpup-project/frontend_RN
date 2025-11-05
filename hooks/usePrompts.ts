import { useState, useEffect, useCallback } from 'react';
import { PromptsAPI } from '../api/endpoints/prompts';
import { Category, Prompt, FilterType } from '../types/prompts';
import { ErrorHandler } from '../utils/errorHandler';

interface UsePromptsParams {
  campusID?: string;
  stateID?: string;
  selectedCategory?: FilterType;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const usePrompts = (params?: UsePromptsParams) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  

  // Fetch categories
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

  // Fetch prompts
  const fetchPrompts = useCallback(async () => {

    console.log('Fetching prompts with params:', {
      campusID: params?.campusID,
      stateID: params?.stateID,
      categoryID: params?.selectedCategory?.id,
    });

    
    setIsLoadingPrompts(true);
    setError(null);
    try {
      const data = await PromptsAPI.fetchPrompts({
        campusID: params?.campusID,
        stateID: params?.stateID,
        categoryID: params?.selectedCategory?.id,
      });
      setPrompts(data.requests);
      setLastUpdated(new Date(data.sentAt));
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err).message;
      setError(errorMessage);
    } finally {
      setIsLoadingPrompts(false);
    }
  }, [params?.campusID, params?.stateID, params?.selectedCategory]);

  // Submit request
  const submitRequest = async (requestID: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await PromptsAPI.submitRequest(requestID);
      // Refresh prompts after submission
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

  // Join public group
  const joinPublicGroup = async (groupID: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await PromptsAPI.joinPublicGroup(groupID);
      // Refresh prompts after joining
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

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchPrompts();
  }, [params?.campusID, params?.stateID, params?.selectedCategory?.id]);

  // Auto-refresh prompts
  useEffect(() => {
    if (params?.autoRefresh) {
      const interval = setInterval(() => {
        fetchPrompts();
      }, params?.refreshInterval || 15000); // Default 15 seconds

      return () => clearInterval(interval);
    }
  }, [params?.autoRefresh, params?.refreshInterval]);

  return {
    // Data
    categories,
    prompts,
    lastUpdated,

    // Loading states
    isLoadingCategories,
    isLoadingPrompts,
    isSubmitting,
    isLoading: isLoadingCategories || isLoadingPrompts,

    // Error
    error,
    clearError: () => setError(null),

    // Actions
    fetchCategories,
    fetchPrompts,
    submitRequest,
    joinPublicGroup,
    refresh: fetchPrompts,
  };
};