import { useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
// @ts-ignore - Type declarations not available
import VersionCheck from 'react-native-version-check';

/**
 * Toggle this to force the update modal for testing
 * ⚠️ SET BACK TO false BEFORE RELEASE
 */
const FORCE_UPDATE_MODAL = false;

export const useAppUpdate = () => {
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        console.log('🔍 Checking for app updates...');

        // 🚧 Skip version check logic if forcing modal
        if (!FORCE_UPDATE_MODAL && __DEV__) {
          console.log('🚧 Development mode — skipping update check');
          return;
        }

        let updateNeeded = null;

        if (FORCE_UPDATE_MODAL) {
          console.log('🧪 FORCE_UPDATE_MODAL enabled');
          updateNeeded = { isNeeded: true };
        } else {
          updateNeeded = await VersionCheck.needUpdate();
        }

        console.log('📦 Update check result:', updateNeeded);

        if (!updateNeeded?.isNeeded) {
          console.log('✅ App is up to date');
          return;
        }

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
                  let url: string | null = null;

                  // 1️⃣ Try automatic store URL
                  try {
                    url = await VersionCheck.getStoreUrl();
                  } catch (err) {
                    console.log('⚠️ getStoreUrl failed:', err);
                  }

                  console.log('🔗 Store URL from VersionCheck:', url);

                  // 2️⃣ Fallback URLs
                  if (!url) {
                    if (Platform.OS === 'android') {
                      url = 'market://details?id=com.Tarpup.app';
                    } else if (Platform.OS === 'ios') {
                      url = 'itms-apps://apps.apple.com/app/id6755878188';
                    }
                  }

                  console.log('🚀 Opening store URL:', url);

                  if (url) {
                    await Linking.openURL(url);
                  } else {
                    throw new Error('No store URL available');
                  }
                } catch (error) {
                  console.error('❌ Failed to open store:', error);

                  if (Platform.OS === 'android') {
                    try {
                      await Linking.openURL(
                        'https://play.google.com/store/apps/details?id=com.Tarpup.app'
                      );
                      return;
                    } catch { }
                  }

                  Alert.alert(
                    'Update',
                    'Could not open the app store. Please search for "Tarpup" manually.'
                  );
                }
              },
            },
          ],
          { cancelable: false } // ⛔ Prevent accidental dismiss during test
        );
      } catch (error) {
        console.error('⚠️ App update check failed:', error);
      }
    };

    checkUpdate();
  }, []);
};
