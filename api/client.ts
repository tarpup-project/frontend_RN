import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { UrlConstants } from '../constants/apiUrls';
import { clearUserData } from '../utils/storage';
import { useAuthStore } from '../state/authStore';


interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: UrlConstants.baseUrl,
  withCredentials: true,  
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    console.log("🚀 API Request:");
    console.log("Method:", config.method?.toUpperCase());
    console.log("URL:", config.url);
    console.log("Headers:", config.headers);
    console.log("Data:", config.data);
    console.log("Params:", config.params);
    return config;
  },
  (error) => {
    console.log("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:");
    console.log("Status:", response.status);
    console.log("Headers:", response.headers);
    console.log("Data:", response.data);
    return response;
  },

  async (error: AxiosError) => {
    console.log("❌ API Error:");
    console.log("Status:", error.response?.status);
    console.log("Status Text:", error.response?.statusText);
    console.log("Error Data:", error.response?.data);
    console.log("Error Headers:", error.response?.headers);
    console.log("Request URL:", error.config?.url);
    console.log("Request Method:", error.config?.method);
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post(UrlConstants.refreshToken);
        
        processQueue(null);
        return api(originalRequest);    
      } catch (err) {
        processQueue(err, null);
        
        await clearUserData();
        useAuthStore.getState().setUser(undefined);
        
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export { api };