import { useState } from 'react';
import { useAuthStore } from '../state/authStore';
import { AuthAPI } from '../api/endpoints/auth';
import { ErrorHandler } from '../utils/errorHandler';
import { SignupRequest } from '../types/auth';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, logout: logoutStore } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create new user account
   */
  const signup = async (data: SignupRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AuthAPI.signup(data);
      return response;
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err).message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send login email to receive OTP
   */
  const login = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AuthAPI.login(email);
      return response;
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err).message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify OTP and complete authentication
   */
  const verifyOTP = async (email: string, otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AuthAPI.verifyOTP(email, otp);
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err).message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend OTP code
   */
  const resendOTP = async (email: string, mode: 'signup' | 'signin' = 'signin') => {
    setLoading(true);
    setError(null);
    try {
      const response = await AuthAPI.resendOTP(email, mode);
      return response;
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err).message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch current authenticated user
   */
  const fetchAuthUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await AuthAPI.fetchAuthUser();
      setUser(user);
      return user;
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err).message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await AuthAPI.logout();
      await logoutStore();
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err).message;
      setError(errorMessage);
      // Still logout locally even if API call fails
      await logoutStore();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete user account
   */
  const deleteAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      await AuthAPI.deleteAccount();
      await logoutStore();
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err).message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    user,
    isAuthenticated,
    isLoading: isLoading || loading,
    error,

    // Actions
    signup,
    login,
    verifyOTP,
    resendOTP,
    fetchAuthUser,
    logout,
    deleteAccount,
    clearError: () => setError(null),
  };
};