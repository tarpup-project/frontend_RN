// import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
// import { UrlConstants } from '../constants/apiUrls';
// import { jwtDecode } from 'jwt-decode';
// import { clearUserData ,getAccessToken, saveAccessToken, getRefreshToken, saveSocketToken } from '../utils/storage';
// import { useAuthStore } from '../state/authStore';

// interface TokenPayload {
//   exp: number;
//   iat: number;
//   id: string;
// }

// interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
//   _retry?: boolean;
// }

// const api = axios.create({
//   baseURL: UrlConstants.baseUrl,
//   withCredentials: true,  
//   timeout: 30000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// let isRefreshing = false;
// let failedQueue: any[] = [];

// const shouldRefreshToken = (token: string, bufferMinutes: number = 5): boolean => {
//   try {
//     const decoded = jwtDecode<TokenPayload>(token);
//     const expiryTime = decoded.exp * 1000;
//     const now = Date.now();
//     const bufferTime = bufferMinutes * 60 * 1000;

//     return (expiryTime - now) < bufferTime;
//   } catch {
//     return true;
//   }
// };

// const processQueue = (error: any, token: string | null = null) => {
//   failedQueue.forEach(prom => {
//     if (error) {
//       prom.reject(error);
//     } else {
//       prom.resolve(token);
//     }
//   });
//   failedQueue = [];
// };


// api.interceptors.request.use(
//   async (config) => {
//     if (config.url?.includes('/refresh')) {
//       return config;
//     }

//     const accessToken = await getAccessToken();
//     const refreshToken = await getRefreshToken();

//     if (accessToken && refreshToken && shouldRefreshToken(accessToken, 5)) {
//       try {
//         console.log('🔄 Proactively refreshing token...');
//         const refreshResponse = await axios.post(
//           `${UrlConstants.baseUrl}${UrlConstants.refreshToken}`,
//           {},
//           {
//             headers: { Authorization: `Bearer ${refreshToken}` }
//           }
//         );

//         if (refreshResponse.data?.data?.authTokens) {
//           await saveAccessToken(refreshResponse.data.data.authTokens.accessToken);
//           await saveSocketToken(refreshResponse.data.data.authTokens.socketToken);
//           config.headers.Authorization = `Bearer ${refreshResponse.data.data.authTokens.accessToken}`;
//           return config;
//         }
//       } catch (error) {
//         console.log('❌ Proactive refresh failed, using current token', error);
//       }
//     }

//     if (accessToken) {
//       config.headers.Authorization = `Bearer ${accessToken}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// api.interceptors.response.use(
//   (response) => response,
//   async (error: AxiosError) => {
//     const originalRequest = error.config as ExtendedAxiosRequestConfig;

//     if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
//       if (isRefreshing) {
//         return new Promise(function (resolve, reject) {
//           failedQueue.push({ resolve, reject });
//         })
//           .then(() => api(originalRequest))
//           .catch(err => Promise.reject(err));
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         const refreshToken = await getRefreshToken();

//         if (!refreshToken) {
//           throw new Error('No refresh token available');
//         }

//         const refreshResponse = await api.post(
//           UrlConstants.refreshToken,
//           {},
//           {
//             headers: {
//               Authorization: `Bearer ${refreshToken}`
//             }
//           }
//         );

//         if (refreshResponse.data?.data?.authTokens) {
//           await saveAccessToken(refreshResponse.data.data.authTokens.accessToken);
//           await saveSocketToken(refreshResponse.data.data.authTokens.socketToken);
//         }

//         processQueue(null);
//         return api(originalRequest);     
//       } catch (err) {
//         processQueue(err, null);

//         await clearUserData();
//         useAuthStore.getState().setUser(undefined);

//         return Promise.reject(err);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export { api };


import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { UrlConstants } from '../constants/apiUrls';
import { useAuthStore } from '../state/authStore';
import { useNetworkStore } from '../state/networkStore';
import { clearUserData, getAccessToken, getRefreshToken, saveAccessToken, saveSocketToken } from '../utils/storage';

interface TokenPayload {
  exp: number;
  iat: number;
  id: string;
}

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _timeoutRetry?: boolean;
}

const api = axios.create({
  baseURL: UrlConstants.baseUrl,
  withCredentials: true,
  timeout: 125000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];
let lastRefreshAttempt = 0;
const REFRESH_COOLDOWN = 10000; // 10 seconds cooldown between refresh attempts

const shouldRefreshToken = (token: string, bufferMinutes: number = 5): boolean => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const expiryTime = decoded.exp * 1000;
    const now = Date.now();
    const bufferTime = bufferMinutes * 60 * 1000;

    return (expiryTime - now) < bufferTime;
  } catch {
    return false; // Don't refresh if we can't decode the token
  }
};

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
    // Skip token refresh for refresh endpoint
    if (config.url?.includes('/refresh')) {
      return config;
    }

    const accessToken = await getAccessToken();

    // Add access token to request if available
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // Clear any previous network error on successful response
    if (useNetworkStore.getState().isApiConnectionError) {
      useNetworkStore.getState().setApiConnectionError(false);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Check cooldown to prevent rapid refresh attempts
      const now = Date.now();
      if (now - lastRefreshAttempt < REFRESH_COOLDOWN) {
        console.log('🚫 Refresh cooldown active, rejecting request');
        return Promise.reject(error);
      }

      // If already refreshing, queue the request
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      lastRefreshAttempt = now;

      try {
        console.log('🔄 Attempting token refresh due to 401...');

        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await axios.post(
          `${UrlConstants.baseUrl}${UrlConstants.refreshToken}`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
            timeout: 15000 // Increased timeout
          }
        );

        if (refreshResponse.data?.data?.authTokens) {
          await saveAccessToken(refreshResponse.data.data.authTokens.accessToken);
          await saveSocketToken(refreshResponse.data.data.authTokens.socketToken);
          console.log('✅ Token refresh successful, retrying original request');

          processQueue(null);
          return api(originalRequest);
        } else {
          throw new Error('Invalid refresh response');
        }
      } catch (err: any) {
        console.log('❌ Token refresh failed:', err.message);
        processQueue(err, null);

        // Only clear auth data if it's an auth error, not network error
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.log('🔒 Auth error - clearing user data');
          await clearUserData();
          useAuthStore.getState().setUser(undefined);
        } else {
          console.log('🌐 Network error - keeping user data for offline use');
        }

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle network errors (timeout, no response, etc)
    if (!error.response || error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      console.log('🌐 Network error detected:', error.message);
      error.code = 'NETWORK_ERROR';

      // Trigger global network error state
      useNetworkStore.getState().setApiConnectionError(true, 'Bad network connection');

      // Single automatic retry for timeout errors with extended timeout
      const originalRequest = error.config as ExtendedAxiosRequestConfig;
      if (originalRequest && !originalRequest._timeoutRetry) {
        originalRequest._timeoutRetry = true;
        const extendedTimeout = Math.max(originalRequest.timeout || 0, 90000);
        console.log(`⏱️ Retrying request once with extended timeout=${extendedTimeout}ms`);
        return api({ ...originalRequest, timeout: extendedTimeout });
      }
    }

    return Promise.reject(error);
  }
);

export { api };
