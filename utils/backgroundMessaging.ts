import { asyncStorageDB, isWatermelonAvailable } from '@/database';
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

// CRITICAL: This handler must return a promise and resolve it when processing is complete
export const setupBackgroundMessageHandler = () => {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('🌙 Background FCM Message:', remoteMessage.messageId);

        try {
            // 1. Validate payload
            const data = remoteMessage.data;
            if (!data) return;

            // Only handle chat messages
            if (data.type !== 'message' && data.type !== 'group_message') return;

            const groupId = data.roomID || data.roomId || data.groupID || data.groupId;
            if (!groupId) return;

            // 2. Transform payload to message format
            const contentId = data.contentId || data.id || remoteMessage.messageId;
            const contentMessage = data.content || data.message || '';
            const senderId = data.senderId;
            const senderName = data.senderName || 'Unknown';

            const message = {
                id: contentId,
                serverId: contentId,
                groupId: groupId,
                content: contentMessage,
                senderId: senderId,
                senderName: senderName,
                replyToId: data.replyToId,
                fileUrl: data.fileUrl,
                fileType: data.fileType,
                isPending: false,
                isSynced: true,
                createdAt: data.createdAt ? Number(data.createdAt) : Date.now(),
                updatedAt: Date.now(),
            };

            console.log(`💾 Saving background message for group ${groupId}`);

            // 3. Save to Database
            if (isWatermelonAvailable) {
                // TODO: WatermelonDB background save
                // Note: WatermelonDB might need special handling in background/headless JS
            } else {
                await asyncStorageDB.initialize();
                await asyncStorageDB.addMessage(String(groupId), message);
                console.log('✅ Background message saved');
            }

            // 4. Update App Badge (Increment by 1)
            try {
                const currentBadge = await Notifications.getBadgeCountAsync();
                await Notifications.setBadgeCountAsync(currentBadge + 1);
                console.log('🔴 [Background] Badge incremented to:', currentBadge + 1);
            } catch (badgeError) {
                console.error('❌ [Background] Failed to update badge:', badgeError);
            }

        } catch (error) {
            console.error('❌ Error processing background message:', error);
        }
    });

    console.log('✅ Background message handler registered');
};
