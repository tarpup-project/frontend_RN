import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { asyncStorageDB, isWatermelonAvailable } from '@/database';
import { useAuthStore } from '@/state/authStore';
import { CacheUtils } from '@/utils/queryClient';
import { watermelonOfflineSyncManager } from '@/utils/watermelonOfflineSync';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
    AlertMessage,
    Group,
    GroupMessage,
    MessageFile,
    MessageType,
    SendMessagePayload,
    UserMessage
} from '../types/groups';
import { SocketEvents } from '../types/socket';
import { groupsKeys } from './useGroups';

interface UseEnhancedGroupMessagesProps {
  groupId: string;
  socket?: any;
}

interface SendMessageOptions {
  message: string;
  file?: MessageFile;
  replyingTo?: UserMessage;
}

interface UseEnhancedGroupMessagesReturn {
  messages: GroupMessage[];
  isLoading: boolean;
  error: string | null;
  isSending: boolean;
  sendMessage: (options: SendMessageOptions) => Promise<boolean>;
  markAsRead: () => void;
  clearError: () => void;
  retryConnection: () => void;
  isCached: boolean;
  isRefreshing: boolean;
}

export const useEnhancedGroupMessages = ({ 
  groupId, 
  socket 
}: UseEnhancedGroupMessagesProps): UseEnhancedGroupMessagesReturn => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enhanced React Query to fetch and cache messages with immediate cache loading
  const { data: messages = [], isLoading, error, isFetching } = useQuery({
    queryKey: ['groups', 'messages', groupId],
    queryFn: async (): Promise<GroupMessage[]> => {
      console.log('🔄 Fetching fresh messages for group:', groupId);
      setIsRefreshing(true);
      
      if (!socket || !user) {
        console.log('⚠️ No socket or user available');
        return [];
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log('⏰ Socket timeout for group:', groupId);
          setIsRefreshing(false);
          resolve([]);
        }, 15000); 

        const handleJoinRoom = async (data: { messages: GroupMessage[] }) => {
          clearTimeout(timeout);
          socket.off('joinGroupRoom', handleJoinRoom);
          
          const freshMessages = data.messages || [];
          console.log('📥 Received fresh messages for group:', groupId, '- Count:', freshMessages.length);
          
          // Save fresh messages to database cache
          try {
            if (isWatermelonAvailable) {
              // TODO: Save to WatermelonDB
              console.log('💾 Saving to WatermelonDB (not implemented yet)');
            } else {
              // Transform and save to AsyncStorage
              const transformedMessages = freshMessages.map(msg => ({
                id: msg.content.id,
                serverId: msg.content.id,
                groupId: groupId,
                content: msg.content.message,
                senderId: msg.messageType === MessageType.USER ? (msg as UserMessage).sender.id : 'system',
                senderName: msg.messageType === MessageType.USER ? (msg as UserMessage).sender.fname : 'System',
                replyToId: msg.messageType === MessageType.USER ? (msg as UserMessage).replyingTo?.content.id : undefined,
                fileUrl: msg.messageType === MessageType.USER ? (msg as UserMessage).file?.data : undefined,
                fileType: msg.messageType === MessageType.USER ? (msg as UserMessage).file?.ext : undefined,
                isPending: false,
                isSynced: true,
                createdAt: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
                updatedAt: Date.now(),
              }));
              
              await asyncStorageDB.saveMessages(groupId, transformedMessages);
              console.log('💾 Saved', transformedMessages.length, 'messages to AsyncStorage for group:', groupId);
            }
          } catch (error) {
            console.error('❌ Failed to save fresh messages to cache:', error);
          }
          
          setIsRefreshing(false);
          resolve(freshMessages);
        };

        const handleError = (error: any) => {
          clearTimeout(timeout);
          console.error('❌ Socket error for group:', groupId, error);
          setIsRefreshing(false);
          resolve([]);
        };

        socket.on('joinGroupRoom', handleJoinRoom);
        socket.on('error', handleError);
        
        socket.emit('joinGroupRoom', {
          roomID: groupId,
          userID: user.id,
        });
      });
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2, // Consider data stale after 2 minutes
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 2,
    // Show cached data immediately while fetching fresh data
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false, // Don't refetch on focus to avoid interrupting user
    refetchOnReconnect: true,
  });

  // Load cached messages immediately on mount
  useEffect(() => {
    const loadCachedMessages = async () => {
      if (!groupId) return;
      
      try {
        console.log('📦 Loading cached messages for group:', groupId);
        
        let cachedMessages: GroupMessage[] = [];
        
        if (isWatermelonAvailable) {
          // TODO: Load from WatermelonDB
          console.log('📦 Loading from WatermelonDB (not implemented yet)');
        } else {
          // Load from AsyncStorage
          const asyncMessages = await asyncStorageDB.getMessages(groupId);
          cachedMessages = asyncMessages.map(msg => {
            const baseMessage = {
              content: {
                id: msg.serverId || msg.id,
                message: msg.content,
              },
              createdAt: new Date(msg.createdAt).toISOString(),
            };

            if (msg.senderId === 'system') {
              return {
                messageType: MessageType.ALERT,
                ...baseMessage,
                sender: {
                  id: 'system',
                  fname: 'System',
                },
              } as AlertMessage;
            } else {
              return {
                messageType: MessageType.USER,
                ...baseMessage,
                sender: {
                  id: msg.senderId,
                  fname: msg.senderName,
                },
                file: msg.fileUrl ? {
                  name: 'file',
                  size: 0,
                  data: msg.fileUrl,
                  ext: msg.fileType || 'image',
                } : undefined,
                replyingTo: msg.replyToId ? {
                  content: { id: msg.replyToId, message: '' },
                  messageType: MessageType.USER,
                  sender: { id: '', fname: '' },
                  createdAt: '',
                } as UserMessage : undefined,
              } as UserMessage;
            }
          });
        }
        
        if (cachedMessages.length > 0) {
          console.log('✅ Loaded', cachedMessages.length, 'cached messages for group:', groupId);
          
          // Set cached data immediately if no fresh data is available
          queryClient.setQueryData<GroupMessage[]>(
            ['groups', 'messages', groupId],
            (currentData) => {
              // Only use cached data if we don't have fresh data yet
              return currentData && currentData.length > 0 ? currentData : cachedMessages;
            }
          );
        }
      } catch (error) {
        console.error('❌ Failed to load cached messages for group:', groupId, error);
      }
    };

    loadCachedMessages();
  }, [groupId, queryClient]);

  // Debug logging
  useEffect(() => {
    const isCached = messages.length > 0 && !isLoading;
    console.log('💬 Enhanced Group Messages State:', {
      groupId,
      messageCount: messages.length,
      isLoading,
      isRefreshing,
      isFetching,
      isCached,
      hasSocket: !!socket,
      hasError: !!error
    });
  }, [groupId, messages, isLoading, isRefreshing, isFetching, socket, error]);

  // Listen for new messages and update cache with optimistic updates
  useEffect(() => {
    if (!socket || !user || !groupId) return;

    const handleNewMessage = async (data: any) => {
      const incomingRoomId = String(
        data?.roomID ??
          data?.roomId ??
          data?.groupID ??
          data?.groupId ??
          data?.room ??
          data?.group ??
          ''
      );
      if (incomingRoomId && incomingRoomId !== String(groupId)) return;

      const contentId =
        data?.content?.id ??
        data?.id ??
        `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const contentMessage =
        data?.content?.message ?? data?.message ?? data?.text ?? '';
      const sender = data?.sender ?? data?.user ?? {};
      const createdAt = data?.createdAt || new Date().toISOString();
      const file = data?.file;
      const replyingTo = data?.replyingTo;
      const type =
        data?.messageType ??
        (sender?.id ? MessageType.USER : MessageType.ALERT);

      const base = {
        content: { id: contentId, message: contentMessage },
        createdAt,
      };

      const newMessage: GroupMessage =
        type === MessageType.USER
          ? ({
              messageType: MessageType.USER,
              ...base,
              sender: {
                id: sender?.id,
                fname: sender?.fname,
              },
              file,
              replyingTo: replyingTo as UserMessage,
            } as UserMessage)
          : ({
              messageType: MessageType.ALERT,
              ...base,
              sender: {
                id: sender?.id,
                fname: sender?.fname,
              },
            } as AlertMessage);

      // Optimistic update with deduplication
      queryClient.setQueryData<GroupMessage[]>(
        ['groups', 'messages', groupId],
        (oldMessages = []) => {
          const exists = oldMessages.find(
            (msg) => msg.content.id === newMessage.content.id
          );
          if (exists) return oldMessages;
          
          const updatedMessages = [...oldMessages, newMessage];
          
          // Save to database cache
          const saveToCache = async () => {
            try {
              if (isWatermelonAvailable) {
                // TODO: Save to WatermelonDB
              } else {
                await asyncStorageDB.addMessage(groupId, {
                  id: contentId,
                  serverId: contentId,
                  groupId: groupId,
                  content: contentMessage,
                  senderId: sender?.id || 'system',
                  senderName: sender?.fname || 'System',
                  replyToId: replyingTo?.content?.id,
                  fileUrl: file?.data,
                  fileType: file?.ext,
                  isPending: false,
                  isSynced: true,
                  createdAt: new Date(createdAt).getTime(),
                  updatedAt: Date.now(),
                });
              }
            } catch (error) {
              console.error('❌ Failed to cache new message:', error);
            }
          };
          saveToCache();
          
          return updatedMessages;
        }
      );
    };

    const eventNames = [
      SocketEvents.GROUP_ROOM_MESSAGE,
      'groupRoomMessage',
      'messageGroupRoom',
      'group_message',
      'groupMessage',
      'newMessage',
      'message',
    ];
    eventNames.forEach((evt) => socket.on(evt as any, handleNewMessage));

    return () => {
      eventNames.forEach((evt) => socket.off(evt as any, handleNewMessage));
    };
  }, [socket, user?.id, groupId, queryClient]);

  const sendMessage = useCallback(async ({ 
    message, 
    file, 
    replyingTo 
  }: SendMessageOptions): Promise<boolean> => {
    if (!user || (!message.trim() && !file)) {
      return false;
    }

    setIsSending(true);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36)}`;
    const messageId = Date.now().toString() + Math.random().toString(36);

    try {
      const payload: SendMessagePayload = {
        roomID: groupId,
        messageType: MessageType.USER,
        content: {
          id: messageId,
          message: message.trim() || '',
        },
        file,
        sender: {
          id: user.id,
          fname: user.fname,
        },
        replyingTo: replyingTo?.content.id,
      };

      const optimisticMessage: UserMessage = {
        messageType: MessageType.USER,
        content: { ...payload.content, id: tempId },
        sender: payload.sender,
        file,
        replyingTo,
        createdAt: new Date().toISOString(),
      };

      // Optimistic update
      queryClient.setQueryData<GroupMessage[]>(
        ['groups', 'messages', groupId],
        (old = []) => {
          const updated = [...old, optimisticMessage];
          return updated;
        }
      );

      // Save optimistic message to cache
      const saveOptimisticToCache = async () => {
        try {
          if (isWatermelonAvailable) {
            // TODO: Save to WatermelonDB
          } else {
            await asyncStorageDB.addMessage(groupId, {
              id: tempId,
              serverId: tempId,
              groupId: groupId,
              content: message.trim() || '',
              senderId: user.id,
              senderName: user.fname,
              replyToId: replyingTo?.content.id,
              fileUrl: file?.data,
              fileType: file?.ext,
              isPending: true,
              isSynced: false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
        } catch (error) {
          console.error('❌ Failed to cache optimistic message:', error);
        }
      };
      saveOptimisticToCache();

      // If offline, add to sync queue
      if (!socket || !socket.connected) {
        console.log('📱 Offline - adding message to sync queue');
        
        try {
          watermelonOfflineSyncManager.addToQueue('message', { ...payload, tempId }, 3);
        } catch {}
        
        setIsSending(false);
        return true;
      }

      // Send via socket if online
      return new Promise((resolve) => {
        socket.emit(SocketEvents.GROUP_ROOM_MESSAGE, payload, (response: any) => {
          if (response.status === 'ok') {
            // Replace temp message with real message
            queryClient.setQueryData<GroupMessage[]>(
              ['groups', 'messages', groupId],
              (old = []) => {
                const updated = old.map(msg => 
                  msg.content.id === tempId 
                    ? { ...msg, content: { ...msg.content, id: messageId } }
                    : msg
                );
                return updated;
              }
            );
            
            // Update cache with real message ID
            const updateCache = async () => {
              try {
                if (isWatermelonAvailable) {
                  // TODO: Update WatermelonDB
                } else {
                  const messages = await asyncStorageDB.getMessages(groupId);
                  const updatedMessages = messages.map(msg => 
                    msg.id === tempId 
                      ? { ...msg, id: messageId, serverId: messageId, isPending: false, isSynced: true }
                      : msg
                  );
                  await asyncStorageDB.saveMessages(groupId, updatedMessages);
                }
              } catch (error) {
                console.error('❌ Failed to update cached message:', error);
              }
            };
            updateCache();
            
            markAsRead();
            resolve(true);
          } else {
            // Remove optimistic message on failure
            queryClient.setQueryData<GroupMessage[]>(
              ['groups', 'messages', groupId],
              (old = []) => {
                const updated = old.filter(msg => msg.content.id !== tempId);
                return updated;
              }
            );
            
            // Remove from cache
            const removeFromCache = async () => {
              try {
                if (isWatermelonAvailable) {
                  // TODO: Remove from WatermelonDB
                } else {
                  const messages = await asyncStorageDB.getMessages(groupId);
                  const filteredMessages = messages.filter(msg => msg.id !== tempId);
                  await asyncStorageDB.saveMessages(groupId, filteredMessages);
                }
              } catch (error) {
                console.error('❌ Failed to remove failed message from cache:', error);
              }
            };
            removeFromCache();
            
            resolve(false);
          }
          setIsSending(false);
        });
      });
    } catch (err) {
      console.error('❌ Send message error:', err);
      // Remove optimistic message on error
      queryClient.setQueryData<GroupMessage[]>(
        ['groups', 'messages', groupId],
        (old = []) => old.filter(msg => msg.content.id !== tempId)
      );
      setIsSending(false);
      return false;
    }
  }, [socket, user, groupId, queryClient]);

  const markAsRead = useCallback(async () => {
    try {
      await api.post(UrlConstants.markGroupMessageAsRead(groupId));
      
      // Update groups cache to reset unread count
      queryClient.setQueriesData<Group[]>(
        { queryKey: groupsKeys.lists() }, 
        (old) => {
          if (!old) return old as any;
          return old.map(g => (g.id === groupId ? { ...g, unread: 0 } : g));
        }
      );
      
      // Invalidate groups queries to refresh
      CacheUtils.invalidateAll();
    } catch (err) {
      console.error('❌ Failed to mark messages as read:', err);
      
      // Add to offline queue if failed
      try {
        watermelonOfflineSyncManager.addToQueue('read_status', { groupId }, 2);
      } catch {}
    }
  }, [groupId, queryClient]);

  return {
    messages,
    isLoading,
    error: error ? String(error) : null,
    isSending,
    sendMessage,
    markAsRead,
    clearError: () => queryClient.resetQueries({ queryKey: ['groups', 'messages', groupId] }),
    retryConnection: () => queryClient.invalidateQueries({ queryKey: ['groups', 'messages', groupId] }),
    isCached: messages.length > 0 && !isLoading,
    isRefreshing,
  };
};

export const useMessageReply = () => {
  const [replyingTo, setReplyingTo] = useState<UserMessage | undefined>();

  const startReply = useCallback((message: UserMessage) => {
    setReplyingTo(message);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(undefined);
  }, []);

  return {
    replyingTo,
    startReply,
    cancelReply,
  };
};

export const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};