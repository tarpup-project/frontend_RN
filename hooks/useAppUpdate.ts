import * as Application from 'expo-application';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import VersionCheck from 'react-native-version-check';

export const useAppUpdate = (autoPrompt = false) => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('');
  const [storeVersion, setStoreVersion] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [loading, setLoading] = useState(true);

  const checkUpdate = useCallback(async () => {
    try {
      setLoading(true);
      // Use expo-application to avoid native module crash in Expo Go
      const current = Application.nativeApplicationVersion || '1.0.0';
      const packageName = Application.applicationId || 'com.Tarpup.app';
      
      setCurrentVersion(current);

      // Get the latest version from the store
      // We pass currentVersion and packageName explicitly to avoid VersionCheck calling native methods that might fail
      const update = await VersionCheck.needUpdate({
        currentVersion: current,
        packageName: packageName,
        country: 'US', // Default to US to avoid calling native getCountry() which might fail
      } as any);
      
      if (update && update.isNeeded) {
        setIsUpdateAvailable(true);
        setStoreVersion(update.latestVersion);
        setStoreUrl(update.storeUrl);
      } else {
        setIsUpdateAvailable(false);
      }
    } catch (error) {
      console.error('Error checking for app update:', error);
      // Fail silently for the user, but log the error
    } finally {
      setLoading(false);
    }
  }, []);

  const openStore = useCallback(async () => {
    if (storeUrl) {
      await Linking.openURL(storeUrl);
    } else {
      // Fallback if storeUrl is missing for some reason
      const appId = Application.applicationId || 'com.Tarpup.app';
      if (Platform.OS === 'ios') {
        // Fallback for iOS usually requires numeric ID, but bundle ID works in some links
        // Ideally storeUrl is populated by VersionCheck
        await Linking.openURL(`https://apps.apple.com/app/bundle-id/${appId}`); 
      } else {
        await Linking.openURL(`market://details?id=${appId}`);
      }
    }
  }, [storeUrl]);

  const promptUser = useCallback(() => {
    Alert.alert(
      'Update Available',
      `A new version of Tarpup (${storeVersion}) is available. Please update to continue using the app with the latest features and fixes.`,
      [
        {
          text: 'Later',
          style: 'cancel',
        },
        {
          text: 'Update Now',
          onPress: openStore,
        },
      ],
      { cancelable: true }
    );
  }, [storeVersion, openStore]);

  // Auto-check on mount
  useEffect(() => {
    checkUpdate();
  }, [checkUpdate]);

  // Auto-prompt when update is available
  useEffect(() => {
    if (autoPrompt && isUpdateAvailable) {
      promptUser();
    }
  }, [isUpdateAvailable, autoPrompt, promptUser]);

  return {
    isUpdateAvailable,
    currentVersion,
    storeVersion,
    checkUpdate,
    openStore,
    promptUser,
    loading
  };
};
