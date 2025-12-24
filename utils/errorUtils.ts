/**
 * Utility functions for handling API errors and providing user-friendly messages
 */

export const getErrorMessage = (error: any): string => {
  // Network errors
  if (!error.response || error.code === 'NETWORK_ERROR') {
    return 'Check your internet connection';
  }

  // Authentication errors
  if (error.response?.status === 401 || error.response?.status === 403) {
    return 'Please sign in again';
  }

  // Server errors
  if (error.response?.status >= 500) {
    return 'Server is temporarily unavailable';
  }

  // Client errors
  if (error.response?.status >= 400) {
    return error.response?.data?.message || 'Something went wrong';
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timed out. Please try again';
  }

  // Generic fallback
  return 'Something went wrong. Please try again';
};

export const isRetryableError = (error: any): boolean => {
  // Don't retry authentication errors
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return false;
  }

  // Don't retry client errors (400-499) except for timeouts
  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    return error.code === 'ECONNABORTED' || error.message?.includes('timeout');
  }

  // Retry network errors and server errors
  return true;
};

export const logError = (context: string, error: any) => {
  console.error(`❌ ${context}:`, {
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    code: error.code,
    data: error.response?.data
  });
};