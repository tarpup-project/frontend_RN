import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { UrlConstants } from '../constants/apiUrls';
import { clearUserData ,getAccessToken, saveAccessToken} from '../utils/storage';
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
  async (config) => {
    const accessToken = await getAccessToken();
    if (accessToken && !config.url?.includes('/refresh-token')) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
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
        const refreshResponse = await api.post(UrlConstants.refreshToken);

        if (refreshResponse.data?.token) {
          await saveAccessToken(refreshResponse.data.token);
        }   
        
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