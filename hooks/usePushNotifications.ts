import { useAuthStore } from '@/state/authStore';
import { registerTopicNotification, setupNotifications } from '@/utils/notifications';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';


export function usePushNotifications() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const tokenRefreshUnsubscribe = useRef<(() => void) | null>(null);


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
        setupForegroundNotificationHandler();
        
        setupBackgroundNotificationHandler();
        
        setupNotificationTapHandler();

        try {
          tokenRefreshUnsubscribe.current = messaging().onTokenRefresh(async (newToken) => {
            console.log('🔁 Refreshed FCM Token:', newToken);
          });
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
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received in foreground:', notification.request.content);
       
      }
    );
  };


  const setupBackgroundNotificationHandler = () => {

    messaging().setBackgroundMessageHandler(async  (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      console.log('📬 Background message received:', remoteMessage);

    });
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

  // Cleanup on unmount or logout
  useEffect(() => {
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
   
    };
  }, []);

  return {
    isInitialized,
    subscribeToTopic,
    subscribeAndRegisterTopic
  };
}
