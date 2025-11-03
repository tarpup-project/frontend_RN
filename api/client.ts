import axios, { AxiosError } from 'axios';
import { UrlConstants } from '../constants/apiUrls';
import { clearUserData } from '../utils/storage';
import { useAuthStore } from '../state/authStore';

const api = axios.create({
  baseURL: UrlConstants.baseUrl,
  withCredentials: true,  
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await clearUserData();
      useAuthStore.getState().setUser(undefined);
    }
    return Promise.reject(error);
  }
);

export { api };