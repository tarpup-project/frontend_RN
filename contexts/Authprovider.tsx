import React, { useEffect } from 'react';
import { useAuthStore } from '@/state/authStore';
import { getUserData, getAccessToken } from '@/utils/storage';
import { api } from '@/api/client';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        const userData = await getUserData();
        const token = await getAccessToken();
        
        if (userData && token) {
          try {
            const response = await api.get('/user/auth');
            setUser(response.data.data || response.data.user);
          } catch (error) {
            setUser(undefined);
          }
        } else {
          setUser(undefined);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(undefined);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return <>{children}</>;
};