import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

// Secure storage keys for tokens
const SECURE_KEYS = {
  ACCESS_TOKEN: 'secure_access_token',
  REFRESH_TOKEN: 'secure_refresh_token',
  TOKEN_EXPIRY: 'secure_token_expiry',
  REFRESH_EXPIRY: 'secure_refresh_expiry',
} as const;

// Token interface
export interface TokenData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
}

// JWT payload interface
interface JWTPayload {
  exp: number;
  iat: number;
  [key: string]: any;
}

export class SecureTokenStorage {
  private static instance: SecureTokenStorage;

  static getInstance(): SecureTokenStorage {
    if (!SecureTokenStorage.instance) {
      SecureTokenStorage.instance = new SecureTokenStorage();
    }
    return SecureTokenStorage.instance;
  }

  /**
   * Save tokens securely with automatic expiry calculation
   */
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      console.log('🔐 Saving tokens to secure storage...');

      // Decode tokens to get expiry times
      const accessPayload = jwtDecode<JWTPayload>(accessToken);
      const refreshPayload = jwtDecode<JWTPayload>(refreshToken);

      const accessExpiry = accessPayload.exp * 1000; // Convert to milliseconds
      const refreshExpiry = refreshPayload.exp * 1000;

      // Save tokens and expiry times securely
      await Promise.all([
        SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, refreshToken),
        SecureStore.setItemAsync(SECURE_KEYS.TOKEN_EXPIRY, accessExpiry.toString()),
        SecureStore.setItemAsync(SECURE_KEYS.REFRESH_EXPIRY, refreshExpiry.toString()),
      ]);

      console.log('✅ Tokens saved securely');
      console.log('🕐 Access token expires:', new Date(accessExpiry).toLocaleString());
      console.log('🕐 Refresh token expires:', new Date(refreshExpiry).toLocaleString());
    } catch (error) {
      console.error('❌ Failed to save tokens:', error);
      throw new Error('Failed to save authentication tokens');
    }
  }

  /**
   * Get access token if valid, otherwise attempt refresh
   */
  async getValidAccessToken(): Promise<string | null> {
    try {
      const accessToken = await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
      const expiryStr = await SecureStore.getItemAsync(SECURE_KEYS.TOKEN_EXPIRY);

      if (!accessToken || !expiryStr) {
        console.log('🔍 No access token found in secure storage');
        return null;
      }

      const expiry = parseInt(expiryStr);
      const now = Date.now();
      const timeUntilExpiry = expiry - now;

      // Only refresh if token expires in less than 1 minute (instead of 5 minutes)
      // This makes tokens last much longer before refresh
      if (timeUntilExpiry < 1 * 60 * 1000) {
        console.log('⏰ Access token expires very soon, attempting refresh...');
        const refreshed = await this.refreshTokens();
        return refreshed ? await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN) : accessToken; // Return current token even if refresh fails
      }

      const minutesLeft = Math.round(timeUntilExpiry / 60000);
      console.log('✅ Access token is valid for', minutesLeft, 'more minutes');
      return accessToken;
    } catch (error) {
      console.error('❌ Failed to get valid access token:', error);
      // Return the token anyway if we can't validate expiry
      try {
        return await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
      } catch {
        return null;
      }
    }
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('❌ Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Check if refresh token is valid
   */
  async isRefreshTokenValid(): Promise<boolean> {
    try {
      const refreshToken = await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
      const expiryStr = await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_EXPIRY);

      if (!refreshToken || !expiryStr) {
        return false;
      }

      const expiry = parseInt(expiryStr);
      const now = Date.now();

      return expiry > now;
    } catch (error) {
      console.error('❌ Failed to check refresh token validity:', error);
      return false;
    }
  }

  /**
   * Refresh tokens using the refresh token
   */
  async refreshTokens(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (!refreshToken) {
        console.log('❌ No refresh token available');
        return false;
      }

      if (!(await this.isRefreshTokenValid())) {
        console.log('❌ Refresh token is expired');
        await this.clearTokens();
        return false;
      }

      console.log('🔄 Refreshing tokens...');

      // Import auth API dynamically to avoid circular dependencies
      const { AuthAPI } = await import('../api/endpoints/auth');
      const response = await AuthAPI.refreshToken(refreshToken);

      if (response.accessToken && response.refreshToken) {
        await this.saveTokens(response.accessToken, response.refreshToken);
        console.log('✅ Tokens refreshed successfully');
        return true;
      } else {
        console.log('❌ Invalid refresh response');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Failed to refresh tokens:', error);
      
      // Don't clear tokens on network errors - they might still be valid
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network')) {
        console.log('🌐 Network error during refresh - keeping tokens for offline use');
        return false; // Return false but don't clear tokens
      }
      
      // Only clear tokens on auth errors (401, 403, etc.)
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('🔒 Auth error during refresh - clearing tokens');
        await this.clearTokens();
      }
      
      return false;
    }
  }

  /**
   * Get all token data
   */
  async getTokenData(): Promise<TokenData | null> {
    try {
      const [accessToken, refreshToken, accessExpiryStr, refreshExpiryStr] = await Promise.all([
        SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(SECURE_KEYS.TOKEN_EXPIRY),
        SecureStore.getItemAsync(SECURE_KEYS.REFRESH_EXPIRY),
      ]);

      if (!accessToken || !refreshToken || !accessExpiryStr || !refreshExpiryStr) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        accessTokenExpiry: parseInt(accessExpiryStr),
        refreshTokenExpiry: parseInt(refreshExpiryStr),
      };
    } catch (error) {
      console.error('❌ Failed to get token data:', error);
      return null;
    }
  }

  /**
   * Check if user has valid authentication
   */
  async hasValidAuth(): Promise<boolean> {
    try {
      const tokenData = await this.getTokenData();
      
      if (!tokenData) {
        console.log("🔍 No token data found in secure storage");
        return false;
      }

      const now = Date.now();
      
      // Check if refresh token is still valid (give it extra buffer)
      const refreshBuffer = 24 * 60 * 60 * 1000; // 24 hours buffer
      if (tokenData.refreshTokenExpiry <= (now - refreshBuffer)) {
        console.log('❌ Refresh token expired (with buffer), clearing tokens');
        await this.clearTokens();
        return false;
      }

      // Be more lenient with access token - only refresh if it's actually expired
      if (tokenData.accessTokenExpiry <= now) {
        console.log('🔄 Access token expired, attempting refresh...');
        const refreshed = await this.refreshTokens();
        // Even if refresh fails, consider auth valid if refresh token is still good
        return refreshed || (tokenData.refreshTokenExpiry > now);
      }

      console.log('✅ Tokens are valid in secure storage');
      return true;
    } catch (error) {
      console.error('❌ Failed to check auth validity:', error);
      // Be optimistic - if we can't check, assume valid if we have tokens
      const tokenData = await this.getTokenData();
      return !!tokenData;
    }
  }

  /**
   * Clear all tokens from secure storage
   */
  async clearTokens(): Promise<void> {
    try {
      console.log('🗑️ Clearing tokens from secure storage...');
      
      await Promise.all([
        SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(SECURE_KEYS.TOKEN_EXPIRY),
        SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_EXPIRY),
      ]);

      console.log('✅ Tokens cleared from secure storage');
    } catch (error) {
      console.error('❌ Failed to clear tokens:', error);
    }
  }

  /**
   * Get token expiry information
   */
  async getTokenExpiryInfo(): Promise<{
    accessTokenExpiry: Date | null;
    refreshTokenExpiry: Date | null;
    accessTokenValid: boolean;
    refreshTokenValid: boolean;
  }> {
    try {
      const tokenData = await this.getTokenData();
      
      if (!tokenData) {
        return {
          accessTokenExpiry: null,
          refreshTokenExpiry: null,
          accessTokenValid: false,
          refreshTokenValid: false,
        };
      }

      const now = Date.now();
      
      return {
        accessTokenExpiry: new Date(tokenData.accessTokenExpiry),
        refreshTokenExpiry: new Date(tokenData.refreshTokenExpiry),
        accessTokenValid: tokenData.accessTokenExpiry > now,
        refreshTokenValid: tokenData.refreshTokenExpiry > now,
      };
    } catch (error) {
      console.error('❌ Failed to get token expiry info:', error);
      return {
        accessTokenExpiry: null,
        refreshTokenExpiry: null,
        accessTokenValid: false,
        refreshTokenValid: false,
      };
    }
  }

  /**
   * Auto-refresh tokens in background
   */
  async startAutoRefresh(): Promise<void> {
    const checkAndRefresh = async () => {
      try {
        const tokenData = await this.getTokenData();
        
        if (!tokenData) {
          return;
        }

        const now = Date.now();
        const timeUntilExpiry = tokenData.accessTokenExpiry - now;
        
        // Only refresh if token expires in less than 2 minutes (instead of 10)
        // This reduces unnecessary refresh attempts
        if (timeUntilExpiry < 2 * 60 * 1000 && timeUntilExpiry > 0) {
          console.log('🔄 Auto-refreshing tokens...');
          await this.refreshTokens();
        }
      } catch (error) {
        console.error('❌ Auto-refresh error:', error);
      }
    };

    // Check every 10 minutes instead of 5 minutes
    setInterval(checkAndRefresh, 10 * 60 * 1000);
    
    // Also check immediately
    checkAndRefresh();
  }
}

// Export singleton instance
export const secureTokenStorage = SecureTokenStorage.getInstance();

// Backward compatibility functions
export const getSecureAccessToken = () => secureTokenStorage.getValidAccessToken();
export const getSecureRefreshToken = () => secureTokenStorage.getRefreshToken();
export const saveSecureTokens = (accessToken: string, refreshToken: string) => 
  secureTokenStorage.saveTokens(accessToken, refreshToken);
export const clearSecureTokens = () => secureTokenStorage.clearTokens();
export const hasValidSecureAuth = () => secureTokenStorage.hasValidAuth();