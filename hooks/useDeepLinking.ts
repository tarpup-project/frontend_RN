import { ReferralUtils } from '@/utils/referralUtils';
import { useEffect } from 'react';
import { Linking } from 'react-native';

export const useDeepLinking = () => {
  useEffect(() => {
    // Handle initial URL when app is opened from a deep link
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('📱 App opened with URL:', initialUrl);
          await ReferralUtils.handleDeepLink(initialUrl);
        }
      } catch (error) {
        console.error('❌ Error handling initial URL:', error);
      }
    };

    // Handle URL when app is already running
    const handleDeepLink = (event: { url: string }) => {
      console.log('🔗 Deep link received:', event.url);
      ReferralUtils.handleDeepLink(event.url);
    };

    // Set up listeners
    handleInitialURL();
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Cleanup
    return () => {
      subscription?.remove();
    };
  }, []);
};

export default useDeepLinking;