import { api } from '../client';
import { UrlConstants } from '../../constants/apiUrls';
import { setupNotifications } from '@/utils/notifications';
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
import { saveAuthToken, saveUserData, clearUserData, saveAccessToken, saveSocketToken, saveRefreshToken } from '../../utils/storage';

export class AuthAPI {

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


  static async login(email: string): Promise<LoginResponse> {
    const response = await api.post<{ status: string; data: string }>(
      UrlConstants.loginUser,
      { email }
    );
    
    return {
      message: response.data.data,
      success: response.data.status === 'success',
    };
  }


  static async verifyOTP(email: string, otp: string): Promise<VerifyOTPResponse> {
    let fcmToken = null;
    try {
      fcmToken = await setupNotifications();
      console.log('📱 FCM Token to send:', fcmToken ? fcmToken.substring(0, 30) + '...' : 'null');
    } catch (error) {
      console.log('⚠️ Could not get FCM token (Expo Go limitation)');
    }

    const response = await api.post<{ 
      status: string; 
      data: { 
        user: AuthUserInterface;
        authTokens: {
          accessToken: string;
          refreshToken: string;
          socketToken: string;
        }
      }
    }>(UrlConstants.verifyOTP, {
      email,
      token: otp, 
      fcmToken: fcmToken,
    });
  
    const { user, authTokens } = response.data.data;
    
    if (user && authTokens) {
      await saveAccessToken(authTokens.accessToken);
      await saveRefreshToken(authTokens.refreshToken);
      await saveSocketToken(authTokens.socketToken); 
      await saveUserData(user);
      console.log('💾 Saved tokens and user data:', user.email);
    }
  
    return {
      user,
      token: authTokens.accessToken,
      message: 'Verification successful',
      success: response.data.status === 'success',
    };
  }


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


  static async fetchAuthUser(): Promise<AuthUserInterface> {
    const response = await api.get<FetchAuthUserResponse>(UrlConstants.fetchAuthUser);    

    if (response.data.success && response.data.user) {
      await saveUserData(response.data.user);
    }

    return response.data.user;
  }


  static async refreshToken(): Promise<{ token: string }> {
    const response = await api.post<{ token: string }>(UrlConstants.refreshToken);
    
    if (response.data.token) {
      await saveAccessToken(response.data.token);
    }

    return response.data;
  }


  static async logout(): Promise<void> {
    try {
      await api.post(UrlConstants.logout);
    } finally {

      await clearUserData();
    }
  }


  static async deleteAccount(): Promise<void> {
    await api.delete(UrlConstants.deleteAccount);
    await clearUserData();
  }
}