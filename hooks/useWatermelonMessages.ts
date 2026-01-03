import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { database, messagesCollection, offlineActionsCollection } from '@/database';
import { Message } from '@/database/models';
import { useAuthStore } from '@/state/authStore';
import { Q } from '@nozbe/watermelondb';
import { useEffect, useState } from 'react';

export const useWatermelonMessages = (groupId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const { user } = useAuthStore();

  // Subscribe to database changes for this group
  useEffect(() => {
    if (!groupId) return;

    const subscription = messagesCollection
      .query(
        Q.where('group_id', groupId),
        Q.sortBy('created_at', Q.desc)
      )
      .observe()
      .subscribe(setMessages);

    // Load initial messages
    loadMessages();

    return () => subscription.unsubscribe();
  }, [groupId]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First, load from database (instant)
      const cachedMessages = await messagesCollection
        .query(
          Q.where('group_id', groupId),
          Q.sortBy('created_at', Q.desc)
        )
        .fetch();

      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
        setIsLoading(false);
      }

      // Then fetch fresh data from server
      await fetchFromServer();
    } catch (err: any) {
      console.error('❌ Load messages error:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFromServer = async () => {
    try {
      console.log('🔄 Fetching messages from server for group:', groupId);
      
      const response = await api.get(UrlConstants.fetchGroupMessages(groupId));

      if (!response.data?.data) {
        console.warn('⚠️ Invalid response structure:', response.data);
        return;
      }

      const serverMessages = response.data.data;
      console.log('✅ Fetched', serverMessages.length, 'messages from server');

      // Update database
      await database.write(async () => {
        const batch: any[] = [];

        for (const serverMessage of serverMessages) {
          // Check if message exists
          const existingMessage = await messagesCollection
            .query(Q.where('server_id', serverMessage.id))
            .fetch();

          if (existingMessage.length === 0) {
            // Create new message
            batch.push(
              messagesCollection.prepareCreate((m: any) => {
                m.serverId = serverMessage.id;
                m.groupId = groupId;
                m.content = serverMessage.content;
                m.senderId = serverMessage.sender.id;
                m.senderName = serverMessage.sender.fname;
                m.senderAvatar = serverMessage.sender.avatar;
                m.replyToId = serverMessage.replyTo;
                m.fileUrl = serverMessage.file?.url;
                m.fileType = serverMessage.file?.type;
                m.isPending = false;
                m.isSynced = true;
              })
            );
          }
        }

        if (batch.length > 0) {
          await database.batch(...batch);
          console.log('✅ Updated', batch.length, 'message records');
        }
      });
    } catch (err: any) {
      console.error('❌ Fetch messages from server error:', err);
      throw err;
    }
  };

  const sendMessage = async (content: string, replyTo?: string, file?: any) => {
    if (!user || !content.trim()) return false;

    setIsSending(true);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Create optimistic message in database
      await database.write(async () => {
        await messagesCollection.create((m: any) => {
          m.groupId = groupId;
          m.content = content.trim();
          m.senderId = user.id;
          m.senderName = user.fname;
          m.senderAvatar = user.avatar;
          m.replyToId = replyTo;
          m.fileUrl = file?.url;
          m.fileType = file?.type;
          m.tempId = tempId;
          m.isPending = true;
          m.isSynced = false;
        });
      });

      // Try to send to server
      try {
        const response = await api.post('/groups/messages', {
          groupId,
          message: content.trim(),
          replyTo,
          file,
        });

        // Update message with server response
        const pendingMessage = await messagesCollection
          .query(Q.where('temp_id', tempId))
          .fetch();

        if (pendingMessage.length > 0) {
          await database.write(async () => {
            await pendingMessage[0].update((m: any) => {
              m.serverId = response.data.data.id;
              m.isPending = false;
              m.isSynced = true;
            });
          });
        }

        console.log('✅ Message sent successfully');
      } catch (networkError) {
        console.log('📱 Network error - message queued for offline sync');
        
        // Add to offline sync queue
        await database.write(async () => {
          await offlineActionsCollection.create((action: any) => {
            action.actionType = 'message';
            action.data = JSON.stringify({
              groupId,
              message: content.trim(),
              replyTo,
              file,
              tempId,
            });
            action.retryCount = 0;
            action.maxRetries = 3;
            action.isSynced = false;
          });
        });
      }

      return true;
    } catch (err: any) {
      console.error('❌ Send message error:', err);
      setError(err.message || 'Failed to send message');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const message = await messagesCollection.find(messageId);
      
      await database.write(async () => {
        await message.destroyPermanently();
      });

      // If message has server ID, also delete from server
      if (message.serverId) {
        try {
          await api.delete(`/groups/messages/${message.serverId}`);
        } catch (networkError) {
          console.log('📱 Network error - delete queued for offline sync');
          
          // Add to offline sync queue
          await database.write(async () => {
            await offlineActionsCollection.create((action: any) => {
              action.actionType = 'delete_message';
              action.data = JSON.stringify({
                messageId: message.serverId,
              });
              action.retryCount = 0;
              action.maxRetries = 3;
              action.isSynced = false;
            });
          });
        }
      }
    } catch (err: any) {
      console.error('❌ Delete message error:', err);
      setError(err.message || 'Failed to delete message');
    }
  };

  const retryPendingMessages = async () => {
    try {
      const pendingMessages = await messagesCollection
        .query(
          Q.where('group_id', groupId),
          Q.where('is_pending', true)
        )
        .fetch();

      for (const message of pendingMessages) {
        if (message.tempId) {
          // Retry sending this message
          await sendMessage(
            message.content,
            message.replyToId,
            message.fileUrl ? { url: message.fileUrl, type: message.fileType } : undefined
          );
        }
      }
    } catch (err: any) {
      console.error('❌ Retry pending messages error:', err);
    }
  };

  return {
    messages,
    isLoading,
    error,
    isSending,
    sendMessage,
    deleteMessage,
    retryPendingMessages,
    refresh: loadMessages,
    // Transform messages to UI format
    uiMessages: messages.map(message => message.toUIFormat()),
    // Get pending messages count
    pendingCount: messages.filter(m => m.isPending).length,
  };
};