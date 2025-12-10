import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import messaging from '@react-native-firebase/messaging';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';


Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });


export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }

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


export async function getFCMToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log('Cannot get FCM token - not a physical device');
      return null;
    }

    const token = await messaging().getToken();
    console.log('✅ FCM Token obtained:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}



export async function setupNotifications(): Promise<string | null> {
  try {
    console.log('🔔 Starting notification setup...');

    const permissionGranted = await requestNotificationPermissions();
    if (!permissionGranted) {
      console.log('⚠️ No permission');
      return null;
    }

    const fcmToken = await getFCMToken();
    if (!fcmToken) {
      console.log('⚠️ No FCM token');
      return null;
    }

    try {
      await api.post(UrlConstants.sendUserNotification, {
        token: fcmToken,
        title: 'Hello World',
        body: 'Hello User, you just got a notification',
      });
      console.log('📨 Sent FCM token to backend');
    } catch (err) {
      console.error('❌ Failed to send FCM token to backend:', err);
    }

    console.log('✅ Got FCM token');
    return fcmToken;
  } catch (error) {
    console.error('❌ Error in notification setup:', error);
    return null;
  }
}

export async function registerTopicNotification(topic: string): Promise<void> {
  try {
    await api.post(UrlConstants.sendTopicNotification, {
      topic,
      title: 'Hello World',
      body: 'Hello User, you just got a notification',
    });
  } catch (error) {
  }
}
