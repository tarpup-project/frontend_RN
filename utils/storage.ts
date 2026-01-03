import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys constants
export const StorageKeys = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  UNIVERSITY_ID: 'university_id',
  CAMPUS_DATA: 'campus_data',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  THEME_PREFERENCE: 'theme_preference',
  NOTIFICATION_SETTINGS: 'notification_settings',
} as const;

// Storage interface for consistent API
interface StorageInterface {
  set: (key: string, value: string) => Promise<void>;
  getString: (key: string) => Promise<string | null>;
  delete: (key: string) => Promise<void>;
  clearAll: () => Promise<void>;
  getAllKeys: () => Promise<string[]>;
}

// AsyncStorage wrapper with consistent interface
const createAsyncStorageWrapper = (prefix: string): StorageInterface => ({
  set: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(`${prefix}_${key}`, value);
    } catch (error) {
      console.error(`❌ ${prefix} set error:`, error);
    }
  },
  getString: async (key: string) => {
    try {
      return await AsyncStorage.getItem(`${prefix}_${key}`);
    } catch (error) {
      console.error(`❌ ${prefix} get error:`, error);
      return null;
    }
  },
  delete: async (key: string) => {
    try {
      await AsyncStorage.removeItem(`${prefix}_${key}`);
    } catch (error) {
      console.error(`❌ ${prefix} delete error:`, error);
    }
  },
  clearAll: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefixedKeys = keys.filter(key => key.startsWith(`${prefix}_`));
      await AsyncStorage.multiRemove(prefixedKeys);
    } catch (error) {
      console.error(`❌ ${prefix} clearAll error:`, error);
    }
  },
  getAllKeys: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(key => key.startsWith(`${prefix}_`)).map(key => key.replace(`${prefix}_`, ''));
    } catch (error) {
      console.error(`❌ ${prefix} getAllKeys error:`, error);
      return [];
    }
  },
});

// Create storage instances
export const cacheStorage = createAsyncStorageWrapper('cache-storage');
export const offlineStorage = createAsyncStorageWrapper('offline-storage');

console.log('✅ AsyncStorage initialized for all storage operations');

// Storage utilities with async support
export const StorageUtils = {
  // Generic storage operations (async)
  set: async (key: string, value: any) => {
    try {
      await storage.set(key, JSON.stringify(value));
    } catch (error) {
      console.error('❌ Storage set error:', error);
    }
  },

  get: async <T>(key: string, defaultValue?: T): Promise<T | null> => {
    try {
      const value = await storage.getString(key);
      return value ? JSON.parse(value) : defaultValue || null;
    } catch (error) {
      console.error('❌ Storage get error:', error);
      return defaultValue || null;
    }
  },

  remove: async (key: string) => {
    try {
      await storage.delete(key);
    } catch (error) {
      console.error('❌ Storage remove error:', error);
    }
  },

  clear: async () => {
    try {
      await storage.clearAll();
    } catch (error) {
      console.error('❌ Storage clear error:', error);
    }
  },

  // Cache-specific operations (async)
  setCache: async (key: string, value: any, ttl?: number) => {
    try {
      const cacheData = {
        value,
        timestamp: Date.now(),
        ttl: ttl || 1000 * 60 * 60 * 24, // Default 24 hours
      };
      await cacheStorage.set(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('❌ Cache set error:', error);
    }
  },

  getCache: async <T>(key: string): Promise<T | null> => {
    try {
      const cached = await cacheStorage.getString(key);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - cacheData.timestamp > cacheData.ttl) {
        await cacheStorage.delete(key);
        return null;
      }

      return cacheData.value;
    } catch (error) {
      console.error('❌ Cache get error:', error);
      return null;
    }
  },

  // Synchronous cache getter for compatibility (returns null if not immediately available)
  getCacheSync: <T>(key: string): T | null => {
    // For React Query compatibility, we'll return null and let the async version handle it
    return null;
  },

  clearCache: async () => {
    try {
      await cacheStorage.clearAll();
    } catch (error) {
      console.error('❌ Cache clear error:', error);
    }
  },

  // Offline storage operations (async)
  setOffline: async (key: string, value: any) => {
    try {
      const offlineData = {
        value,
        timestamp: Date.now(),
        synced: false,
      };
      await offlineStorage.set(key, JSON.stringify(offlineData));
    } catch (error) {
      console.error('❌ Offline storage set error:', error);
    }
  },

  getOffline: async <T>(key: string): Promise<T | null> => {
    try {
      const offline = await offlineStorage.getString(key);
      if (!offline) return null;

      const offlineData = JSON.parse(offline);
      return offlineData.value;
    } catch (error) {
      console.error('❌ Offline storage get error:', error);
      return null;
    }
  },

  getUnsyncedOfflineData: async (): Promise<Array<{ key: string; data: any }>> => {
    try {
      const keys = await offlineStorage.getAllKeys();
      const unsyncedData: Array<{ key: string; data: any }> = [];

      for (const key of keys) {
        const data = await offlineStorage.getString(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (!parsed.synced) {
            unsyncedData.push({ key, data: parsed });
          }
        }
      }

      return unsyncedData;
    } catch (error) {
      console.error('❌ Get unsynced data error:', error);
      return [];
    }
  },

  markAsSynced: async (key: string) => {
    try {
      const data = await offlineStorage.getString(key);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.synced = true;
        await offlineStorage.set(key, JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('❌ Mark as synced error:', error);
    }
  },

  clearOffline: async () => {
    try {
      await offlineStorage.clearAll();
    } catch (error) {
      console.error('❌ Offline storage clear error:', error);
    }
  },
};

// Auth-specific storage functions (for backward compatibility)
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN);
  } catch (error) {
    console.error('❌ Get access token error:', error);
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(StorageKeys.REFRESH_TOKEN);
  } catch (error) {
    console.error('❌ Get refresh token error:', error);
    return null;
  }
};

export const saveUserData = async (userData: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(StorageKeys.USER_DATA, JSON.stringify(userData));
    
    // Only save tokens if they're provided in userData
    if (userData.accessToken) {
      await AsyncStorage.setItem(StorageKeys.ACCESS_TOKEN, userData.accessToken);
    }
    if (userData.refreshToken) {
      await AsyncStorage.setItem(StorageKeys.REFRESH_TOKEN, userData.refreshToken);
    }
  } catch (error) {
    console.error('❌ Save user data error:', error);
  }
};

export const getUserData = async (): Promise<any | null> => {
  try {
    const userData = await AsyncStorage.getItem(StorageKeys.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('❌ Get user data error:', error);
    return null;
  }
};

export const clearUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      StorageKeys.ACCESS_TOKEN,
      StorageKeys.REFRESH_TOKEN,
      StorageKeys.USER_DATA,
      StorageKeys.UNIVERSITY_ID,
    ]);
  } catch (error) {
    console.error('❌ Clear user data error:', error);
  }
};

// Additional auth token functions
export const saveAccessToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(StorageKeys.ACCESS_TOKEN, token);
  } catch (error) {
    console.error('❌ Save access token error:', error);
  }
};

export const saveRefreshToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(StorageKeys.REFRESH_TOKEN, token);
  } catch (error) {
    console.error('❌ Save refresh token error:', error);
  }
};

export const saveSocketToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('socket_token', token);
  } catch (error) {
    console.error('❌ Save socket token error:', error);
  }
};

export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('❌ Save auth token error:', error);
  }
};

// Enhanced storage interface with getValue method
export const storage = {
  ...createAsyncStorageWrapper('app-storage'),
  
  // Add getValue method for backward compatibility
  getValue: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`❌ Get value error for key ${key}:`, error);
      return null;
    }
  },
  
  // Add setValue method for consistency
  setValue: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`❌ Set value error for key ${key}:`, error);
    }
  },
};