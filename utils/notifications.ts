import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { UrlConstants } from '@/constants/apiUrls';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions from user
 * Returns true if granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return false;
  }

  try {
    // Check current permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If not granted, request permission
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    // Setup Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }

    // Request iOS permission for Firebase
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('iOS notification permission denied');
        return false;
      }
    }

    console.log('✅ Notification permissions granted');
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get FCM token from Firebase
 * This token is used for topic subscriptions and backend registration
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log('Cannot get FCM token - not a physical device');
      return null;
    }

    // Get FCM token
    const token = await messaging().getToken();
    console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Register FCM token with backend
 * This tells the server which device belongs to which user
 */
export async function registerTokenWithBackend(
  token: string,
  authToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`${UrlConstants.baseUrl}/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        fcmToken: token,
      }),
    });

    if (response.ok) {
      console.log('✅ FCM token registered with backend');
      return true;
    } else {
      const errorData = await response.json();
      console.error('❌ Failed to register FCM token:', response.status, errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ Error registering FCM token with backend:', error);
    return false;
  }
}

/**
 * Complete notification setup flow
 * Call this on login or app launch when user is authenticated
 */
export async function setupNotifications(authToken: string): Promise<boolean> {
  try {
    console.log('🔔 Starting notification setup...');

    // Step 1: Request permissions
    const permissionGranted = await requestNotificationPermissions();
    if (!permissionGranted) {
      console.log('⚠️ Notification setup aborted - no permission');
      return false;
    }

    // Step 2: Get FCM token
    const fcmToken = await getFCMToken();
    if (!fcmToken) {
      console.log('⚠️ Notification setup aborted - no FCM token');
      return false;
    }

    // Step 3: Register token with backend
    const registered = await registerTokenWithBackend(fcmToken, authToken);
    if (!registered) {
      console.log('⚠️ Notification setup completed but backend registration failed');
      return false;
    }

    console.log('✅ Notification setup completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error in notification setup:', error);
    return false;
  }
}

/**
 * Handle token refresh
 * Firebase tokens can change, so we need to update the backend when that happens
 */
export function setupTokenRefreshListener(authToken: string): () => void {
  const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
    console.log('🔄 FCM token refreshed:', newToken.substring(0, 20) + '...');
    await registerTokenWithBackend(newToken, authToken);
  });

  return unsubscribe;
}