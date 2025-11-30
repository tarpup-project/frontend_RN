import { create } from 'zustand';
import { AuthUserInterface } from '../types/auth';
import { getUserData, clearUserData, getAccessToken, saveUserData } from '../utils/storage';

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
    set({ isLoading: true });
    try {
      const [userData, token] = await Promise.all([
        getUserData(),
        getAccessToken()
      ]);

      console.log('🔍 Hydrating auth state...');
    console.log('📦 userData:', userData);
    console.log('🔑 token:', token ? 'exists' : 'null');
      
      if (userData && token) {
        console.log('✅ Restoring session for:', userData);
        set({
          user: userData as AuthUserInterface,
          isAuthenticated: true,
          isHydrated: true,
        });
      } else {
        console.log('❌ No session to restore');
        set({ isHydrated: true });
      }
    } catch (error) {
      console.error('Error hydrating auth state:', error);
      set({ isHydrated: true });
    } finally {
      set({ isLoading: false });
    }
  },
}));