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
import { saveAuthToken, saveUserData, clearUserData, saveAccessToken } from '../../utils/storage';

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
    const response = await api.post<{ data: AuthUserInterface }>(UrlConstants.verifyOTP, {
      email,
      token: otp, 
    });


  console.log('🔍 Raw verify response:', JSON.stringify(response.data, null, 2));
    const userData = response.data.data;
    console.log('👤 userData:', JSON.stringify(userData, null, 2));
    if (userData) {
      if (userData.authToken) {
        await saveAccessToken(userData.authToken);
        console.log('💾 Saved token:', userData.authToken.substring(0, 20) + '...');
      } else {
        console.log('⚠️ No authToken in response');
      }
      await saveUserData(userData);
      console.log('💾 Saved user data:', userData.email);
    }

    return {
      user: userData,
      token: userData.authToken || '',
      message: 'Verification successful',
      success: true,
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