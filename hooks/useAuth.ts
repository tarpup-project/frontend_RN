import { useState } from 'react';
import { useAuthStore } from '../state/authStore';
import { AuthAPI } from '../api/endpoints/auth';
import { ErrorHandler } from '../utils/errorHandler';
import { SignupRequest } from '../types/auth';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, logout: logoutStore } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


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

  const verifyOTP = async (email: string, otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AuthAPI.verifyOTP(email, otp);
      if (response.success && response.user) {
        setUser(response.user);
        console.log("otp verified")
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


  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await AuthAPI.logout();
      await logoutStore();
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err).message;
      setError(errorMessage);
      await logoutStore();
    } finally {
      setLoading(false);
    }
  };


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
    user,
    isAuthenticated,
    isLoading: isLoading || loading,
    error,

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