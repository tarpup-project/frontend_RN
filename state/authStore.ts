import { create } from 'zustand';
import { AuthUserInterface } from '../types/auth';
import { getUserData, clearUserData } from '../utils/storage';

interface AuthState {
  user: AuthUserInterface | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: AuthUserInterface | undefined) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
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
      isLoading: false,
    });
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const userData = await getUserData();
      if (userData) {
        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: undefined,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({
        user: undefined,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));