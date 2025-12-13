// app/test-notifications.tsx
import { usePushNotifications } from '@/hooks/usePushNotifications';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TestNotificationsScreen() {
  const { expoPushToken, notification } = usePushNotifications();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Push Notification Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Your Expo Push Token:</Text>
        <Text style={styles.token} selectable>
          {expoPushToken || 'Loading...'}
        </Text>
      </View>

      {notification && (
        <View style={styles.section}>
          <Text style={styles.label}>Last Notification:</Text>
          <Text style={styles.text}>
            Title: {notification.request.content.title}
          </Text>
          <Text style={styles.text}>
            Body: {notification.request.content.body}
          </Text>
          <Text style={styles.text}>
            Data: {JSON.stringify(notification.request.content.data, null, 2)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  token: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
  },
  text: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
});