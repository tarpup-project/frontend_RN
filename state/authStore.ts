import { create } from 'zustand';
import { AuthUserInterface } from '../types/auth';
import { getUserData, clearUserData } from '../utils/storage';

interface AuthState {
  user: AuthUserInterface | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: AuthUserInterface | undefined) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => {
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
}));