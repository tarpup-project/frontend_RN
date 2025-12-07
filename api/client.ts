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
import { UrlConstants } from '../constants/apiUrls';
import { jwtDecode } from 'jwt-decode';
import { clearUserData, getAccessToken, saveAccessToken, getRefreshToken, saveSocketToken } from '../utils/storage';
import { useAuthStore } from '../state/authStore';

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

const shouldRefreshToken = (token: string, bufferMinutes: number = 5): boolean => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const expiryTime = decoded.exp * 1000;
    const now = Date.now();
    const bufferTime = bufferMinutes * 60 * 1000;

    return (expiryTime - now) < bufferTime;
  } catch {
    return true;
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
    if (config.url?.includes('/refresh')) {
      return config;
    }

    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();

    if (accessToken && refreshToken && !isRefreshing && shouldRefreshToken(accessToken, 5)) {
      isRefreshing = true;

      try {
        console.log('🔄 Proactively refreshing token...');
        console.log('📍 Refresh URL:', `${UrlConstants.baseUrl}${UrlConstants.refreshToken}`);
        console.log('🔑 Using refreshToken:', refreshToken?.substring(0, 20) + '...');
        const refreshResponse = await axios.post(
          `${UrlConstants.baseUrl}${UrlConstants.refreshToken}`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` }
          }
        );        

        if (refreshResponse.data?.data?.authTokens) {
          await saveAccessToken(refreshResponse.data.data.authTokens.accessToken);
          await saveSocketToken(refreshResponse.data.data.authTokens.socketToken);
          config.headers.Authorization = `Bearer ${refreshResponse.data.data.authTokens.accessToken}`;
        }
      } catch (error) {
        console.log('❌ Proactive refresh failed, using current token');
      } finally {
        isRefreshing = false;
      }
    }

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
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await axios.post(
          `${UrlConstants.baseUrl}${UrlConstants.refreshToken}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`
            }
          }
        );

        if (refreshResponse.data?.data?.authTokens) {
          await saveAccessToken(refreshResponse.data.data.authTokens.accessToken);
          await saveSocketToken(refreshResponse.data.data.authTokens.socketToken);
        }

        processQueue(null);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);

        const status = (err as AxiosError).response?.status;
        if (status === 401 || status === 403) {
          await clearUserData();
          useAuthStore.getState().setUser(undefined);
        }

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { api };
