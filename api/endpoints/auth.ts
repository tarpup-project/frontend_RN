import { api } from '../client';
import { UrlConstants } from '../../constants/apiUrls';
import {
  LoginRequest,
  LoginResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  ResendOTPRequest,
  FetchAuthUserResponse,
  AuthUserInterface,
  SignupRequest,
  SignupResponse,
} from '../../types/auth';
import { saveAuthToken, saveUserData, clearUserData } from '../../utils/storage';

export class AuthAPI {
  /**
   * Create new user account and send OTP
   */
  static async signup(data: SignupRequest): Promise<SignupResponse> {
    const response = await api.post<{ data: { message: string } }>(
      UrlConstants.createUser,
      {
        email: data.email,
        fullName: data.fullName,
        universityID: data.universityID,
        stateID: data.stateID,
        referrerID: data.referrerID,
      }
    );
    return {
      message: response.data.data.message,
      success: true,
    };
  }

  /**
   * Send login email to receive OTP
   */
  static async login(email: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(UrlConstants.loginUser, {
      email,
    });
    return response.data;
  }

  /**
   * Verify OTP and complete login/signup
   */
  static async verifyOTP(email: string, otp: string): Promise<VerifyOTPResponse> {
    const response = await api.post<{ data: AuthUserInterface }>(UrlConstants.verifyOTP, {
      email,
      token: otp, // Backend expects 'token' not 'otp'
    });

    // Save token and user data on successful verification
    const userData = response.data.data;
    if (userData) {
      // If user has authToken in response, save it
      if (userData.authToken) {
        await saveAuthToken(userData.authToken);
      }
      await saveUserData(userData);
    }

    return {
      user: userData,
      token: userData.authToken || '',
      message: 'Verification successful',
      success: true,
    };
  }

  /**
   * Resend OTP code
   */
  static async resendOTP(email: string, mode: 'signup' | 'signin' = 'signin'): Promise<LoginResponse> {
    const response = await api.post<{ data: string }>(UrlConstants.resendVerifyOTP, {
      email,
      mode,
    });
    return {
      message: response.data.data,
      success: true,
    };
  }

  /**
   * Fetch authenticated user data
   */
  static async fetchAuthUser(): Promise<AuthUserInterface> {
    const response = await api.get<FetchAuthUserResponse>(UrlConstants.fetchAuthUser);
    
    // Update stored user data
    if (response.data.success && response.data.user) {
      await saveUserData(response.data.user);
    }

    return response.data.user;
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(): Promise<{ token: string }> {
    const response = await api.post<{ token: string }>(UrlConstants.refreshToken);
    
    // Save new token
    if (response.data.token) {
      await saveAuthToken(response.data.token);
    }

    return response.data;
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await api.post(UrlConstants.logout);
    } finally {
      // Clear local data regardless of API response
      await clearUserData();
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(): Promise<void> {
    await api.delete(UrlConstants.deleteAccount);
    await clearUserData();
  }
}