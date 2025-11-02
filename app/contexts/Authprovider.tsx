import React, { useEffect } from 'react';
import { useAuthStore } from '@/state/authStore';
import { getAccessToken } from '@/utils/storage';
import { api } from '@/api/client';
// import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setUser, setLoading, initializeAuth } = useAuthStore();

  const fetchAuthUser = async () => {
    try {
      const accessToken = await getAccessToken();
      
      if (!accessToken) {
        setUser(undefined);
        return;
      }
  
      const response = await api.get('/user/auth');
      setUser(response.data.data);
    } catch (error) {
      console.error('Error fetching auth user:', error);
      setUser(undefined);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await initializeAuth();
      await fetchAuthUser();
      setLoading(false);
    };

    initialize();
  }, []);

  return <>{children}</>;
};