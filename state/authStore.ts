import { jwtDecode } from 'jwt-decode';
import { create } from "zustand";
import { AuthUserInterface } from "../types/auth";
import { secureTokenStorage } from "../utils/secureTokenStorage";
import {
    clearUserData,
    getAccessToken,
    getRefreshToken,
    getUserData,
    saveUserData
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

      // Get tokens from storage (prioritize regular storage to avoid loops)
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();

      console.log("🔑 accessToken:", accessToken ? "exists" : "null");
      console.log("🔑 refreshToken:", refreshToken ? "exists" : "null");

      if (accessToken && refreshToken) {
        try {
          const decoded = jwtDecode<any>(refreshToken);
          console.log(
            "🔍 RefreshToken expires at:",
            new Date(decoded.exp * 1000)
          );
          console.log(
            "⏰ Days until expiry:",
            ((decoded.exp * 1000 - Date.now()) / (1000 * 60 * 60 * 24)).toFixed(1)
          );

          // Check if refresh token is expired
          if (decoded.exp * 1000 <= Date.now()) {
            console.log("❌ Refresh token expired, clearing storage");
            await clearUserData();
            await secureTokenStorage.clearTokens();
            set({
              user: undefined,
              isAuthenticated: false,
              isLoading: false,
              isHydrated: true,
            });
            return;
          }

          // Try to get stored user first (avoid API call if possible)
          const storedUser = await getUserData();
          console.log("📦 Stored user data:", storedUser ? `${storedUser.email} (${storedUser.fname})` : "null");
          
          if (isValidAuthUser(storedUser)) {
            console.log("✅ Using stored user data:", storedUser.email);
            set({
              user: storedUser,
              isAuthenticated: true,
              isLoading: false,
              isHydrated: true,
            });
            return;
          }

          // Only validate with API if no stored user
          console.log("🔄 No stored user, validating tokens with API...");
          const { AuthAPI } = await import("../api/endpoints/auth");
          const user = await AuthAPI.fetchAuthUser();

          console.log("✅ Auto-login successful:", user.email);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isHydrated: true,
          });
        
        } catch (error: any) {
          console.log("❌ Token validation failed:", error.message);
          
          // Try stored user as fallback
          const storedUser = await getUserData();
          if (isValidAuthUser(storedUser)) {
            console.log("✅ Using stored user as fallback:", storedUser.email);
            set({
              user: storedUser,
              isAuthenticated: true,
              isLoading: false,
              isHydrated: true,
            });
          } else {
            console.log("❌ No valid stored user, clearing storage");
            await clearUserData();
            await secureTokenStorage.clearTokens();
            set({
              user: undefined,
              isAuthenticated: false,
              isLoading: false,
              isHydrated: true,
            });
          }
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
