import { useEffect, useRef, useState} from 'react';
import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { useRouter } from 'expo-router';
import { setupNotifications, setupTokenRefreshListener } from '@/utils/notifications';
import { useAuthStore } from '@/state/authStore';

/**
 * Hook to manage push notifications throughout the app
 * Call this once in your root layout or main app component
 */
export function usePushNotifications() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const tokenRefreshUnsubscribe = useRef<(() => void) | null>(null);

  // Initialize notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.authToken && !isInitialized) {
      initializeNotifications();
    }
  }, [isAuthenticated, user, isInitialized]);

  const initializeNotifications = async () => {
    if (!user?.authToken) return;

    try {
      console.log('🔔 Initializing push notifications...');

      // Setup notifications (permissions, FCM token, backend registration)
      const success = await setupNotifications(user.authToken);
      
      if (success) {
        // Setup token refresh listener
        tokenRefreshUnsubscribe.current = setupTokenRefreshListener(user.authToken);
        
        // Setup foreground notification handler
        setupForegroundNotificationHandler();
        
        // Setup background notification handler
        setupBackgroundNotificationHandler();
        
        // Setup notification tap handler
        setupNotificationTapHandler();
        
        setIsInitialized(true);
        console.log('✅ Push notifications initialized');
      } else {
        console.log('⚠️ Push notification initialization failed');
      }
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
    }
  };

  /**
   * Handle notifications when app is in foreground
   */
  const setupForegroundNotificationHandler = () => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received in foreground:', notification.request.content);
        // Notification will automatically show as banner due to our handler config
      }
    );
  };

  /**
   * Handle notifications when app is in background or quit state
   * User can interact with notification to open app
   */
  const setupBackgroundNotificationHandler = () => {
    // Handle background messages (data-only messages)
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('📬 Background message received:', remoteMessage);
      // Process background notification here if needed
    });
  };

  /**
   * Handle when user taps on a notification
   * Navigate to appropriate screen based on notification data
   */
  const setupNotificationTapHandler = () => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response.notification.request.content);
        
        const data = response.notification.request.content.data;
        
        // Navigate based on notification type
        if (data?.type === 'group' && data?.groupId) {
          // Navigate to specific group chat
          router.push(`/(tabs)/groups/chat/${data.groupId}` as any);
        } else if (data?.type === 'message' && data?.chatId) {
          // Navigate to personal chat
          router.push(`/(app)/messages/${data.chatId}` as any);
        } else if (data?.screen) {
          // Navigate to custom screen
          router.push(data.screen as any);
        } else {
          // Default: Navigate to groups tab
          router.push('/(tabs)/groups' as any);
        }
      }
    );
  };

  // Cleanup on unmount or logout
  useEffect(() => {
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (tokenRefreshUnsubscribe.current) {
        tokenRefreshUnsubscribe.current();
      }
    };
  }, []);

  return {
    isInitialized,
  };
}