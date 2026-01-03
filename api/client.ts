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
import { secureTokenStorage } from '../utils/secureTokenStorage';
import { clearUserData, getAccessToken, getRefreshToken, saveAccessToken, saveSocketToken } from '../utils/storage';

interface TokenPayload {
  exp: number;
  iat: number;
  id: string;
}

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

const shouldRefreshToken = (token: string, bufferMinutes: number = 1): boolean => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const expiryTime = decoded.exp * 1000;
    const now = Date.now();
    const bufferTime = bufferMinutes * 60 * 1000;

    // Only refresh if token expires in less than 1 minute (instead of 5)
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

    // Try to get valid access token from secure storage first
    let accessToken = await secureTokenStorage.getValidAccessToken();
    
    // Fallback to regular storage for backward compatibility
    if (!accessToken) {
      accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();

      // If we have tokens in regular storage, migrate to secure storage
      if (accessToken && refreshToken) {
        try {
          await secureTokenStorage.saveTokens(accessToken, refreshToken);
          console.log('🔄 Migrated tokens to secure storage');
        } catch (error) {
          console.warn('⚠️ Failed to migrate tokens to secure storage:', error);
        }
      }
      
      // Only check if we should refresh if we have both tokens
      if (accessToken && refreshToken && shouldRefreshToken(accessToken, 1)) {
        console.log('🔄 Token expires very soon, attempting proactive refresh...');
        try {
          const refreshResponse = await axios.post(
            `${UrlConstants.baseUrl}${UrlConstants.refreshToken}`,
            {},
            {
              headers: { Authorization: `Bearer ${refreshToken}` },
              timeout: 10000
            }
          );
          
          if (refreshResponse.data?.data?.authTokens) {
            await saveAccessToken(refreshResponse.data.data.authTokens.accessToken);
            await saveSocketToken(refreshResponse.data.data.authTokens.socketToken);
            accessToken = refreshResponse.data.data.authTokens.accessToken;
            console.log('✅ Proactive refresh successful');
          }
        } catch (error) {
          console.log('❌ Proactive refresh failed, using current token');
          // Continue with current token
        }
      }
    }

    // Add access token to request if available
    if (accessToken) {
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

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
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

      try {
        console.log('🔄 Attempting token refresh due to 401...');
        
        // Try secure token refresh first
        const refreshed = await secureTokenStorage.refreshTokens();
        
        if (refreshed) {
          console.log('✅ Secure token refresh successful, retrying original request');
          processQueue(null);
          return api(originalRequest);
        }

        // Fallback to regular token refresh
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await axios.post(
          `${UrlConstants.baseUrl}${UrlConstants.refreshToken}`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
            timeout: 10000
          }
        );

        if (refreshResponse.data?.data?.authTokens) {
          await saveAccessToken(refreshResponse.data.data.authTokens.accessToken);
          await saveSocketToken(refreshResponse.data.data.authTokens.socketToken);
          console.log('✅ Token refresh successful, retrying original request');
        }

        processQueue(null);
        return api(originalRequest);
      } catch (err: any) {
        console.log('❌ Token refresh failed:', err.message);
        processQueue(err, null);

        // Clear auth data on refresh failure
        await clearUserData();
        await secureTokenStorage.clearTokens();
        useAuthStore.getState().setUser(undefined);

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle network errors
    if (!error.response) {
      console.log('🌐 Network error detected:', error.message);
      error.code = 'NETWORK_ERROR';
    }

    return Promise.reject(error);
  }
);

export { api };
