import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  statusCode?: number;
  field?: string;
}

export class ErrorHandler {
  static handle(error: unknown): ApiError {
    if (error instanceof AxiosError) {
      // Network error
      if (!error.response) {
        return {
          message: 'Network error. Please check your internet connection.',
          statusCode: 0,
        };
      }

      // Server responded with error
      const statusCode = error.response.status;
      const data = error.response.data;

      // Try to extract error message from response
      const message =
        data?.message || data?.error || this.getDefaultMessage(statusCode);

      return {
        message,
        statusCode,
        field: data?.field,
      };
    }

    // Generic error
    if (error instanceof Error) {
      return {
        message: error.message,
      };
    }

    // Unknown error
    return {
      message: 'An unexpected error occurred. Please try again.',
    };
  }

  private static getDefaultMessage(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Unauthorized. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  static getUserFriendlyMessage(error: ApiError): string {
    return error.message;
  }
}

// Helper function to show toast/alert
export const showError = (error: unknown) => {
  const apiError = ErrorHandler.handle(error);
  // You can replace this with your preferred toast library
  // For now, using console.error
  console.error('API Error:', apiError.message);
  return apiError.message;
};