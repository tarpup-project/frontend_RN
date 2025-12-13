import { useAuthStore } from '@/state/authStore';
import { registerTopicNotification, setupNotifications } from '@/utils/notifications';
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';


export function usePushNotifications() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const tokenRefreshUnsubscribe = useRef<(() => void) | null>(null);
  const firebaseForegroundUnsubscribe = useRef<(() => void) | null>(null);


  useEffect(() => {
    if (isAuthenticated && user?.authToken && !isInitialized) {
      initializeNotifications();
    }
  }, [isAuthenticated, user, isInitialized]);

  const initializeNotifications = async () => {
    if (!user?.authToken) return;

    try {
      console.log('🔔 Initializing push notifications...');

      const fcmToken = await setupNotifications();
      
      if (fcmToken) {
        setExpoPushToken(fcmToken);
        setupForegroundNotificationHandler();
        
        setupNotificationTapHandler();

        try {
          tokenRefreshUnsubscribe.current = messaging().onTokenRefresh(async (newToken) => {
            console.log('🔁 Refreshed FCM Token:', newToken);
          });
        } catch {}
        
        try {
          await subscribeToTopic('all');
          if (Platform.OS === 'android') {
            await subscribeToTopic('android');
          }
          if (Platform.OS === 'ios') {
            await subscribeToTopic('ios');
          }
        } catch {}

        setIsInitialized(true);
        console.log('✅ Push notifications initialized');
      } else {
        console.log('⚠️ Push notification initialization failed');
      }
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
    }
  };


  const setupForegroundNotificationHandler = () => {
    // Expo notifications listener (notifications presented by OS)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received in foreground:', notification.request.content);
        setNotification(notification);
      }
    );

    // Firebase foreground messages (data-only or non-presented notifications)
    try {
      firebaseForegroundUnsubscribe.current = messaging().onMessage(async (remoteMessage) => {
        console.log('📬 Firebase onMessage (foreground):', remoteMessage);

        const title = remoteMessage.notification?.title || remoteMessage.data?.title || 'Notification';
        const body = remoteMessage.notification?.body || remoteMessage.data?.body || '';
        const data = remoteMessage.data || {};

        // Present a local notification so it shows while app is in foreground
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: String(title),
              body: String(body),
              data,
              sound: 'default',
            },
            trigger: null,
          });
        } catch (err) {
          console.log('❌ Failed to present local notification:', err);
        }
      });
    } catch {}
  };


  const setupNotificationTapHandler = () => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response.notification.request.content);
        
        const data = response.notification.request.content.data;
        
        // Navigate based on notification type
        if (data?.type === 'group' && data?.groupId) {
          // Navigate to specific group chat
          router.push(`/(tabs)/group-chat/${data.groupId}` as any);
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
  const subscribeToTopic = async (topic: string) => {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`🔔 Subscribed to topic: ${topic}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to subscribe to topic:', error);
      return { success: false, error };
    }
  };

  const subscribeAndRegisterTopic = async (topic: string) => {
    try {
      await messaging().subscribeToTopic(topic);
      await registerTopicNotification(topic);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const unsubscribeFromTopic = async (topic: string) => {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`🔕 Unsubscribed from topic: ${topic}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to unsubscribe from topic:', error);
      return { success: false, error };
    }
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
      if (firebaseForegroundUnsubscribe.current) {
        try { firebaseForegroundUnsubscribe.current(); } catch {}
        firebaseForegroundUnsubscribe.current = null;
      }
   
    };
  }, []);

  return {
    isInitialized,
    expoPushToken,
    notification,
    subscribeToTopic,
    subscribeAndRegisterTopic,
    unsubscribeFromTopic
  };
}
