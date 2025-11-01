import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Storage Keys
export class StorageKeys {
  static APP_THEME = 'app_theme';
  static USER_AUTH_TOKEN = 'user-token';
  static UNIVERSITY_ID = 'university.id';
  static STATE_ID = 'state.id';
  static USER_DATA = 'user.data';
}

// Storage utility class
class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!this.instance) {
      this.instance = new StorageService();
    }
    return this.instance;
  }

  // Secure storage for auth tokens (uses Keychain on iOS, EncryptedSharedPreferences on Android)
  async setSecureValue(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Fallback to AsyncStorage on web
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('Error saving secure value:', error);
      throw error;
    }
  }

  async getSecureValue(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error('Error getting secure value:', error);
      return null;
    }
  }

  async deleteSecureValue(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Error deleting secure value:', error);
      throw error;
    }
  }

  // Regular storage for non-sensitive data
  async setValue(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error saving value:', error);
      throw error;
    }
  }

  async getValue(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting value:', error);
      return null;
    }
  }

  async deleteValue(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error deleting value:', error);
      throw error;
    }
  }

  // Store object as JSON
  async setObject(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error saving object:', error);
      throw error;
    }
  }

  async getObject<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error getting object:', error);
      return null;
    }
  }

  // Clear all storage
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
      // Note: SecureStore doesn't have a clear all method, need to delete keys individually
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storage = StorageService.getInstance();

// Helper functions for common operations
export const saveAuthToken = async (token: string) => {
  await storage.setSecureValue(StorageKeys.USER_AUTH_TOKEN, token);
};

export const getAuthToken = async (): Promise<string | null> => {
  return await storage.getSecureValue(StorageKeys.USER_AUTH_TOKEN);
};

export const deleteAuthToken = async () => {
  await storage.deleteSecureValue(StorageKeys.USER_AUTH_TOKEN);
};

export const saveUserData = async (user: any) => {
  await storage.setObject(StorageKeys.USER_DATA, user);
};

export const getUserData = async () => {
  return await storage.getObject(StorageKeys.USER_DATA);
};

export const clearUserData = async () => {
  await deleteAuthToken();
  await storage.deleteValue(StorageKeys.USER_DATA);
};