import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { UrlConstants } from '../constants/apiUrls';
import { getAuthToken, saveAuthToken, clearUserData } from '../utils/storage';

// Create axios instance
const api = axios.create({
  baseURL: UrlConstants.baseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add auth token to headers
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Attempt to refresh the token
      const response = await api.post(UrlConstants.refreshToken);
      
      // If refresh successful, save new token
      if (response.data.token) {
        await saveAuthToken(response.data.token);
      }

      processQueue(null);
      return api(originalRequest);
    } catch (err) {
      // Refresh failed - clear user data and force re-login
      processQueue(err, null);
      await clearUserData();
      
      // Optionally: Navigate to login screen
      // This would need to be handled by your navigation system
      // You might want to emit an event here that your app can listen to
      
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export { api };