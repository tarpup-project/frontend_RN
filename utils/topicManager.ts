import messaging from '@react-native-firebase/messaging';

/**
 * Subscribe to a group's notification topic
 * Call this when user joins a group or on app launch for all user's groups
 */
export async function subscribeToGroupTopic(groupId: string): Promise<boolean> {
  try {
    const topic = `group_${groupId}`;
    await messaging().subscribeToTopic(topic);
    console.log(`✅ Subscribed to topic: ${topic}`);
    return true;
  } catch (error) {
    console.error(`❌ Error subscribing to group_${groupId}:`, error);
    return false;
  }
}

/**
 * Unsubscribe from a group's notification topic
 * Call this when user leaves a group
 */
export async function unsubscribeFromGroupTopic(groupId: string): Promise<boolean> {
  try {
    const topic = `group_${groupId}`;
    await messaging().unsubscribeFromTopic(topic);
    console.log(`✅ Unsubscribed from topic: ${topic}`);
    return true;
  } catch (error) {
    console.error(`❌ Error unsubscribing from group_${groupId}:`, error);
    return false;
  }
}

/**
 * Subscribe to all groups user is a member of
 * Call this on login/app launch after fetching user's groups
 */
export async function subscribeToAllUserGroups(groupIds: string[]): Promise<void> {
  console.log(`🔔 Subscribing to ${groupIds.length} group topics...`);
  
  const subscriptionPromises = groupIds.map(groupId => subscribeToGroupTopic(groupId));
  
  try {
    const results = await Promise.allSettled(subscriptionPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`✅ Subscribed to ${successful}/${groupIds.length} groups`);
    if (failed > 0) {
      console.log(`⚠️ Failed to subscribe to ${failed} groups`);
    }
  } catch (error) {
    console.error('❌ Error subscribing to user groups:', error);
  }
}

/**
 * Unsubscribe from all groups
 * Call this on logout to clean up subscriptions
 */
export async function unsubscribeFromAllUserGroups(groupIds: string[]): Promise<void> {
  console.log(`🔕 Unsubscribing from ${groupIds.length} group topics...`);
  
  const unsubscriptionPromises = groupIds.map(groupId => unsubscribeFromGroupTopic(groupId));
  
  try {
    await Promise.allSettled(unsubscriptionPromises);
    console.log(`✅ Unsubscribed from all groups`);
  } catch (error) {
    console.error('❌ Error unsubscribing from user groups:', error);
  }
}