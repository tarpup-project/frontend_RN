import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { UrlConstants } from '../constants/apiUrls';
import { getAccessToken, clearUserData } from '../utils/storage';
import { useAuthStore } from '../state/authStore';

const api = axios.create({
  baseURL: UrlConstants.baseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


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