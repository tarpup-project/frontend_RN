import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { UrlConstants } from '@/constants/apiUrls';
import { useAuthStore } from '@/state/authStore';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as Notifications.NotificationBehavior),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
      
      console.log('Expo Push Token:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

// Move these OUTSIDE the usePushNotifications function
export async function subscribeToTopic(topic: string) {
  try {
    const { user, isAuthenticated } = useAuthStore.getState();
    
    if (!isAuthenticated || !user) {
      console.log('No authenticated user, cannot subscribe to topic');
      return;
    }

    console.log(`User subscribed to topic: ${topic}`);
    const response = await fetch(`${UrlConstants.baseUrl}/user/notifications/subscribe-topic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(user.authToken && { 'Authorization': `Bearer ${user.authToken}` }),
      },
      body: JSON.stringify({
        topic: topic,
      }),
    });

    if (response.ok) {
      console.log(`Successfully subscribed to topic: ${topic}`);
    }
  } catch (error) {
    console.error('Error subscribing to topic:', error);
  }
}

export async function unsubscribeFromTopic(topic: string) {
  try {
    const { user, isAuthenticated } = useAuthStore.getState();
    
    if (!isAuthenticated || !user) {
      console.log('No authenticated user, cannot unsubscribe from topic');
      return;
    }

    const response = await fetch(`${UrlConstants.baseUrl}/user/notifications/unsubscribe-topic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(user.authToken && { 'Authorization': `Bearer ${user.authToken}` }),
      },
      body: JSON.stringify({
        topic: topic,
      }),
    });

    if (response.ok) {
      console.log(`Successfully unsubscribed from topic: ${topic}`);
    }
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
  }
}

async function sendTokenToBackend(token: string) {
  try {
    const { user, isAuthenticated } = useAuthStore.getState();
    
    if (!isAuthenticated || !user) {
      console.log('No authenticated user found, skipping token upload');
      return;
    }

    const response = await fetch(`${UrlConstants.baseUrl}/user/notifications/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(user.authToken && { 'Authorization': `Bearer ${user.authToken}` }),
      },
      body: JSON.stringify({
        token: token,
        title: "Push Notification Setup",
        body: `${user.fname} ${user.lname || ''}, you're now connected for notifications!`,
      }),
    });

    if (response.ok) {
      console.log('Push token sent to backend successfully');
    } else {
      const errorData = await response.json();
      console.error('Failed to send push token:', response.status, errorData);
    }
  } catch (error) {
    console.error('Error sending token to backend:', error);
  }
}

export function usePushNotifications() {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        sendTokenToBackend(token);
      }
    });
  
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      setNotification(notification);
    });
  
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data;
      
      if (data.type === 'message' && data.chatId) {
        router.push(`/(app)/messages/${data.chatId}` as any);
      } else if (data.type === 'group' && data.groupId) {
        router.push(`/(app)/groups/${data.groupId}` as any);
      } else if (data.screen) {
        router.push(data.screen as any);
      }
    });
  
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
    expoPushToken,
    notification,
  };
}