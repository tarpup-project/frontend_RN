import { create } from 'zustand';
import { AuthUserInterface } from '../types/auth';
import { getUserData, clearUserData, getAccessToken, saveUserData, getRefreshToken } from '../utils/storage';

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
    set({
      user: undefined,
      isAuthenticated: false,
    });
  },


  hydrate: async () => {
    set({ isLoading: true, isHydrated: false });
    
    try {
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();
      
      console.log('🔍 Hydrating auth state...');
      console.log('🔑 accessToken:', accessToken ? 'exists' : 'null');
      console.log('🔑 refreshToken:', refreshToken ? 'exists' : 'null');
      
      if (accessToken && refreshToken) {
        try {
          console.log('🔄 Validating tokens with fetchAuthUser...');

          const { AuthAPI } = await import('../api/endpoints/auth');
          const user = await AuthAPI.fetchAuthUser();
          
          console.log('✅ Auto-login successful:', user.email);
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false, 
            isHydrated: true 
          });
        } catch (error) {
          console.log('❌ Token validation failed, clearing data');
          await clearUserData();
          set({ 
            user: undefined, 
            isAuthenticated: false, 
            isLoading: false, 
            isHydrated: true 
          });
        }
      } else {
        console.log('ℹ️ No tokens found, user needs to login');
        set({ 
          user: undefined, 
          isAuthenticated: false, 
          isLoading: false, 
          isHydrated: true 
        });
      }
    } catch (error) {
      console.error('❌ Hydration error:', error);
      set({ 
        user: undefined, 
        isAuthenticated: false, 
        isLoading: false, 
        isHydrated: true 
      });
    }
  },
}));