import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

// Create the query client with optimized settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes before considering it stale
      staleTime: 1000 * 60 * 5,
      // Keep data in cache for 24 hours
      gcTime: 1000 * 60 * 60 * 24,
      // Retry failed requests up to 3 times
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (when app comes back to foreground)
      refetchOnWindowFocus: true,
      // Refetch when network reconnects
      refetchOnReconnect: true,
      // Removed refetchOnMount: 'always' to prevent continuous loading
      // Keep previous data while fetching new data
      placeholderData: (previousData: any) => previousData,
    },
    mutations: {
      // Retry mutations up to 2 times
      retry: 2,
      // Exponential backoff for mutation retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 3000,
});

// Deprecated: Persistence is now handled by PersistQueryClientProvider
export const initializeQueryPersistence = async () => {
  console.log('✅ Query persistence is handled by PersistQueryClientProvider');
  return Promise.resolve();
};

// Utility functions for cache management
export const CacheUtils = {
  // Invalidate all queries
  invalidateAll: () => {
    queryClient.invalidateQueries();
  },

  // Clear all cache
  clearAll: async () => {
    queryClient.clear();
    // The default key used by persistQueryClient is usually passed in options.
    // We will use 'REACT_QUERY_OFFLINE_CACHE' in _layout.tsx
    await AsyncStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');
  },

  // Get cache statistics
  getCacheStats: () => {
    const queryCache = queryClient.getQueryCache();
    const allQueries = queryCache.getAll();
    const staleQueries = allQueries.filter(q => q.isStale());
    const fetchingQueries = allQueries.filter(q => q.state.status === 'pending');
    
    return {
      total: allQueries.length,
      stale: staleQueries.length,
      fetching: fetchingQueries.length,
    };
  },
};
