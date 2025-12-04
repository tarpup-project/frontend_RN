import messaging from '@react-native-firebase/messaging';


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