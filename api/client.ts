import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { UrlConstants } from '../constants/apiUrls';
import { getAccessToken, getRefreshToken, saveTokens, clearUserData } from '../utils/storage';

const api = axios.create({
  baseURL: UrlConstants.baseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

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
      const refreshToken = await getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(
        `${UrlConstants.baseUrl}${UrlConstants.refreshToken}`,
        { refreshToken }
      );
      
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

      await saveTokens(newAccessToken, newRefreshToken);

      processQueue(null, newAccessToken);
      return api(originalRequest);
    } catch (err) {
      processQueue(err, null);
      await clearUserData();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export { api };