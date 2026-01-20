import { useAuthStore } from '@/state/authStore';
import { setupNotifications } from '@/utils/notifications';
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export function usePushNotifications() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);

  // Guards & subscriptions
  const initializingRef = useRef(false);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const firebaseForegroundUnsubscribe = useRef<(() => void) | null>(null);
  const tokenRefreshUnsubscribe = useRef<(() => void) | null>(null);
  const handlersInitializedRef = useRef(false);

  /* -------------------------------------------------------------------------- */
  /*                             INITIALIZATION                                 */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!isAuthenticated || !user?.authToken || isInitialized) return;
    if (initializingRef.current) return;

    initializingRef.current = true;
    initializeNotifications();
  }, [isAuthenticated, user, isInitialized]);

  // Ensure handlers are active even before auth completes
  useEffect(() => {
    if (handlersInitializedRef.current) return;
    try {
      setupForegroundHandlers();
      setupNotificationTapHandler();
      handlersInitializedRef.current = true;
    } catch (e) { }
  }, []);

  const initializeNotifications = async () => {
    try {
      console.log('🔔 Initializing push notifications...');

      const token = await setupNotifications();
      if (!token) {
        console.log('⚠️ Notification setup failed');
        initializingRef.current = false;
        return;
      }

      setFcmToken(token);

      setupForegroundHandlers();
      setupNotificationTapHandler();
      setupTokenRefreshHandler();
      await subscribeToDefaultTopics();

      setIsInitialized(true);
      console.log('✅ Push notifications initialized');
    } catch (error) {
      console.error('❌ Push notification init error:', error);
      initializingRef.current = false;
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                         FOREGROUND HANDLING                                 */
  /* -------------------------------------------------------------------------- */
  const setupForegroundHandlers = () => {
    if (notificationListener.current || firebaseForegroundUnsubscribe.current) {
      return;
    }

    // Expo: listens to notifications already presented by the OS
    notificationListener.current =
      Notifications.addNotificationReceivedListener(notification => {
        console.log(
          '📬 Expo notification received:',
          notification.request.content
        );
        setNotification(notification);
      });

    // Firebase: handles foreground messages
    firebaseForegroundUnsubscribe.current = messaging().onMessage(
      async remoteMessage => {
        console.log('📬 Firebase onMessage (foreground):', remoteMessage);

        const data = remoteMessage.data || {};
        const title =
          remoteMessage.notification?.title ||
          data?.title ||
          'Notification';
        const body =
          remoteMessage.notification?.body ||
          data?.body ||
          '';

        // ✅ FIXED: Always show notification in foreground
        // channelId moved to content, trigger set to null
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: String(title),
              body: String(body),
              data,
              sound: 'default',
              ...(Platform.OS === 'android' && {
                channelId: 'default',
              }),
            },
            trigger: null, // null = show immediately on both platforms
          });

          // Increment badge for foreground notification
          const currentBadge = await Notifications.getBadgeCountAsync();
          await Notifications.setBadgeCountAsync(currentBadge + 1);

          console.log('✅ Foreground notification scheduled');
        } catch (err) {
          console.error('❌ Foreground local notification error:', err);
        }
      }
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                        NOTIFICATION TAP HANDLER                             */
  /* -------------------------------------------------------------------------- */
  /* -------------------------------------------------------------------------- */
  /*                        NOTIFICATION TAP HANDLER                             */
  /* -------------------------------------------------------------------------- */
  const setupNotificationTapHandler = () => {
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log(
          '👆 Notification tapped:',
          response.notification.request.content
        );

        const data = response.notification.request.content.data;

        // Create a normalized ID from either groupID or groupId
        const targetGroupId = data?.groupID || data?.groupId;

        if (targetGroupId) {
          // Navigate to group chat if we have an ID
          // Construct minimal data for immediate display using notification title
          const title = response.notification.request.content.title;
          const minimalGroupData = {
            id: targetGroupId,
            name: title || "Group Chat",
            members: [],
          };

          router.push({
            pathname: `/group-chat/${targetGroupId}` as any,
            params: {
              groupData: JSON.stringify(minimalGroupData)
            }
          });
        } else if (data?.type === 'group' && data?.groupId) {
          router.push(`/group-chat/${data.groupId}` as any);
        } else if (data?.type === 'message' && data?.chatId) {
          router.push(`/(app)/messages/${data.chatId}` as any);
        } else if (data?.screen) {
          router.push(data.screen as any);
        } else {
          // Default to groups list
          router.push('/(tabs)/groups' as any);
        }
      });
  };

  /* -------------------------------------------------------------------------- */
  /*                          TOKEN REFRESH                                     */
  /* -------------------------------------------------------------------------- */
  const setupTokenRefreshHandler = () => {
    tokenRefreshUnsubscribe.current = messaging().onTokenRefresh(
      async newToken => {
        console.log('🔁 FCM token refreshed:', newToken);
        setFcmToken(newToken);
        // Optional: send updated token to backend
      }
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                            TOPIC SUBSCRIPTION                               */
  /* -------------------------------------------------------------------------- */
  const subscribeToDefaultTopics = async () => {
    try {
      await messaging().subscribeToTopic('all');
      if (Platform.OS === 'android') {
        await messaging().subscribeToTopic('android');
      }
      if (Platform.OS === 'ios') {
        await messaging().subscribeToTopic('ios');
      }
      console.log('🔔 Subscribed to default topics');
    } catch (error) {
      console.error('❌ Topic subscription error:', error);
    }
  };

  const subscribeToTopic = async (topic: string) => {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`🔔 Subscribed to topic: ${topic}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Subscribe topic failed:', error);
      return { success: false, error };
    }
  };

  const unsubscribeFromTopic = async (topic: string) => {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`🔕 Unsubscribed from topic: ${topic}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Unsubscribe topic failed:', error);
      return { success: false, error };
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                CLEANUP                                     */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      tokenRefreshUnsubscribe.current?.();
      firebaseForegroundUnsubscribe.current?.();
    };
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                  API                                       */
  /* -------------------------------------------------------------------------- */
  return {
    isInitialized,
    fcmToken,
    notification,
    subscribeToTopic,
    unsubscribeFromTopic,
  };
}