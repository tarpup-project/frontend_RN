import { jwtDecode } from 'jwt-decode';
import { create } from "zustand";
import { AuthUserInterface } from "../types/auth";
import { secureTokenStorage } from "../utils/secureTokenStorage";
import {
    clearUserData,
    getAccessToken,
    getRefreshToken,
    getUserData,
    saveUserData,
} from "../utils/storage";

// Helper function to validate if an object is a valid AuthUserInterface
const isValidAuthUser = (user: any): user is AuthUserInterface => {
  return (
    user &&
    typeof user === 'object' &&
    typeof user.id === 'string' &&
    typeof user.fname === 'string' &&
    typeof user.email === 'string' &&
    typeof user.isStudent === 'boolean'
  );
};

interface AuthState {
  user: AuthUserInterface | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  setUser: (user: AuthUserInterface | undefined) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,

  setUser: (user) => {
    if (user) {
      saveUserData(user);
    }
    set({
      user,
      isAuthenticated: !!user,
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  logout: async () => {
    await clearUserData();
    await secureTokenStorage.clearTokens();
    set({
      user: undefined,
      isAuthenticated: false,
    });
  },

  hydrate: async () => {
    set({ isLoading: true, isHydrated: false });

    try {
      console.log("🔍 Hydrating auth state...");

      // First check secure storage
      const hasValidSecureAuth = await secureTokenStorage.hasValidAuth();
      console.log("🔐 Secure auth check result:", hasValidSecureAuth);
      
      if (hasValidSecureAuth) {
        console.log("🔐 Valid secure authentication found");
        
        try {
          console.log("🔄 Validating tokens with fetchAuthUser...");

          const { AuthAPI } = await import("../api/endpoints/auth");
          const user = await AuthAPI.fetchAuthUser();

          console.log("✅ Auto-login successful:", user.email);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isHydrated: true,
          });
          
          // Start auto-refresh
          secureTokenStorage.startAutoRefresh();
          return;
        
        } catch (error: any) {
          console.log("❌ Token validation failed:", error.message);
          console.log("🔄 But tokens are still valid, checking stored user...");
          
          // Even if API call fails, if we have valid tokens, try to use stored user
          const storedUser = await getUserData();
          console.log("📦 Stored user data:", storedUser ? `${storedUser.email} (${storedUser.fname})` : "null");
          
          if (isValidAuthUser(storedUser)) {
            console.log("✅ Using stored user data with valid secure tokens:", storedUser.email);
            set({
              user: storedUser,
              isAuthenticated: true,
              isLoading: false,
              isHydrated: true,
            });
            
            // Start auto-refresh
            secureTokenStorage.startAutoRefresh();
            return;
          } else {
            console.log("❌ No valid stored user, continuing to regular storage fallback...");
            console.log("📋 User validation failed. Required fields check:", {
              hasUser: !!storedUser,
              hasId: storedUser?.id,
              hasFname: storedUser?.fname,
              hasEmail: storedUser?.email,
              hasIsStudent: typeof storedUser?.isStudent === 'boolean'
            });
          }
        }
      }

      // Fallback to regular storage for backward compatibility
      let accessToken = await getAccessToken();
      let refreshToken = await getRefreshToken();

      // If regular storage is empty, try to get from secure storage
      if (!accessToken || !refreshToken) {
        console.log("🔍 Regular storage empty, checking secure storage...");
        accessToken = await secureTokenStorage.getValidAccessToken();
        refreshToken = await secureTokenStorage.getRefreshToken();
        
        // If we found tokens in secure storage, migrate them to regular storage
        if (accessToken && refreshToken) {
          console.log("🔄 Migrating tokens from secure to regular storage...");
          await saveAccessToken(accessToken);
          await saveRefreshToken(refreshToken);
        }
      }

      console.log("🔑 accessToken:", accessToken ? "exists" : "null");
      console.log("🔑 refreshToken:", refreshToken ? "exists" : "null");

      if (accessToken && refreshToken) {
        const decoded = jwtDecode<any>(refreshToken);
        console.log(
          "🔍 RefreshToken expires at:",
          new Date(decoded.exp * 1000)
        );
        console.log(
          "⏰ Days until expiry:",
          ((decoded.exp * 1000 - Date.now()) / (1000 * 60 * 60 * 24)).toFixed(1)
        );

        try {
          console.log("🔄 Validating tokens with fetchAuthUser...");

          const { AuthAPI } = await import("../api/endpoints/auth");
          const user = await AuthAPI.fetchAuthUser();

          console.log("✅ Auto-login successful:", user.email);
          
          // Migrate to secure storage
          await secureTokenStorage.saveTokens(accessToken, refreshToken);
          console.log("🔄 Migrated tokens to secure storage");
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isHydrated: true,
          });
          
          // Start auto-refresh
          secureTokenStorage.startAutoRefresh();
        
        } catch (error) {
          console.log("❌ Token validation failed, falling back to stored user");
          const storedUser = await getUserData();
          console.log("📦 Fallback stored user data:", storedUser ? `${storedUser.email} (${storedUser.fname})` : "null");
          
          if (isValidAuthUser(storedUser)) {
            set({
              user: storedUser,
              isAuthenticated: true,
              isLoading: false,
              isHydrated: true,
            });
          } else {
            console.log("❌ Invalid stored user data, clearing storage");
            await clearUserData();
            await secureTokenStorage.clearTokens();
            set({
              user: undefined,
              isAuthenticated: false,
              isLoading: false,
              isHydrated: true,
            });
          }
          return;
        }
      } else {
        console.log("ℹ️ No tokens found, user needs to login");
        set({
          user: undefined,
          isAuthenticated: false,
          isLoading: false,
          isHydrated: true,
        });
      }
    } catch (error) {
      console.error("❌ Hydration error:", error);
      set({
        user: undefined,
        isAuthenticated: false,
        isLoading: false,
        isHydrated: true,
      });
    }
  },
}));
