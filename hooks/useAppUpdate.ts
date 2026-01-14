import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
// @ts-ignore - Type declarations not available
import VersionCheck from 'react-native-version-check';

/**
 * Hook to check for app updates on Play Store (Android) or App Store (iOS)
 * and prompt the user to update if a new version is available.
 * 
 * Note: This only works in production builds of published apps.
 * In development mode, it will return undefined.
 */
export const useAppUpdate = () => {
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        console.log('🔍 Checking for app updates via react-native-version-check...');
        
        // Check if we're in development mode
        const isDevelopment = __DEV__;
        
        if (isDevelopment) {
          console.log('🚧 App is in development mode - skipping update check');
          return;
        }
        
        // This will fetch the latest version from Play Store / App Store
        const updateNeeded = await VersionCheck.needUpdate();
        
        console.log('📦 App update check result:', updateNeeded);

        if (updateNeeded?.isNeeded) {
          Alert.alert(
            'Update Available',
            'A new version of the app is available. Please update for the best experience.',
            [
              {
                text: 'Later',
                style: 'cancel',
              },
              {
                text: 'Update Now',
                onPress: async () => {
                  try {
                    // Get the store URL (automatically detects Play Store or App Store)
                    const url = await VersionCheck.getStoreUrl();
                    if (url) {
                      Linking.openURL(url);
                    }
                  } catch (e) {
                    console.error('❌ Failed to open store URL:', e);
                  }
                },
              },
            ],
            { cancelable: true }
          );
        } else if (updateNeeded === null || updateNeeded === undefined) {
          console.log('ℹ️ Unable to check for updates - app may not be published yet or network issue');
        } else {
          console.log('✅ App is up to date');
        }
      } catch (error) {
        // Errors can happen if app is not in store yet or network issues
        console.error('⚠️ App update check failed:', error);
        
        // Common reasons for failure:
        // - App not published on store yet
        // - Bundle ID mismatch
        // - Network connectivity issues
        // - Store API temporarily unavailable
      }
    };

    checkUpdate();
  }, []);
};
