import { api } from '@/api/client';
import { MessageImageCacheUtils } from '@/components/CachedMessageImage';
import { UrlConstants } from '@/constants/apiUrls';
import { asyncStorageDB, isWatermelonAvailable } from '@/database';
import { useAuthStore } from '@/state/authStore';
import { CacheUtils } from '@/utils/queryClient';
import { useNotificationStore } from '@/state/notificationStore';
import { watermelonOfflineSyncManager } from '@/utils/watermelonOfflineSync';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const lastQueuedReadAtRef = useRef<number>(0);

  // CRITICAL FIX: Load cached messages BEFORE query initialization to prevent race condition
  const [initialCacheLoaded, setInitialCacheLoaded] = useState(false);
  
  // Helper function to resolve reply messages from cache
  const resolveReplyMessage = useCallback(async (replyToId: string, messages: any[]): Promise<UserMessage | undefined> => {
    if (!replyToId) return undefined;
    
    // First, try to find in the current messages array
    const replyMessage = messages.find((msg: any) => {
      const uid = msg?.content?.id ?? msg?.id ?? msg?.serverId;
      return uid === replyToId;
    });
    
    if (replyMessage) {
      // Support both UI GroupMessage shape and raw cached shape
      const isUIShape = !!replyMessage.messageType;
      if (isUIShape) {
        const fileData = replyMessage.file?.data;
        const text = replyMessage.content?.message || (fileData ? '📷 Image' : '');
        return {
          content: {
            id: replyMessage.content?.id,
            message: text,
          },
          messageType: MessageType.USER,
          sender: {
            id: replyMessage.sender?.id,
            fname: replyMessage.sender?.fname,
          },
          file: fileData ? {
            name: 'image',
            size: 0,
            data: fileData,
            ext: replyMessage.file?.ext || 'image',
          } : undefined,
          createdAt: replyMessage.createdAt || new Date().toISOString(),
        } as UserMessage;
      } else {
        // Raw cached message shape
        const fileUrl = replyMessage.fileUrl;
        const text = replyMessage.content || (fileUrl ? '📷 Image' : '');
        return {
          content: {
            id: replyMessage.serverId || replyMessage.id,
            message: text,
          },
          messageType: MessageType.USER,
          sender: {
            id: replyMessage.senderId,
            fname: replyMessage.senderName,
          },
          file: fileUrl ? {
            name: 'image',
            size: 0,
            data: fileUrl,
            ext: replyMessage.fileType || 'image',
          } : undefined,
          createdAt: new Date(replyMessage.createdAt).toISOString(),
        } as UserMessage;
      }
    }
    
    // If not found in current messages, try to load from cache using the new method
    try {
      const cachedReply = await asyncStorageDB.getMessageById(replyToId);
      
      if (cachedReply) {
        const fileUrl = cachedReply.fileUrl;
        const messageContent = cachedReply.content && cachedReply.content.trim() !== '' 
          ? cachedReply.content 
          : (fileUrl ? '📷 Image' : '');
        return {
          content: {
            id: cachedReply.serverId || cachedReply.id,
            message: messageContent,
          },
          messageType: MessageType.USER,
          sender: {
            id: cachedReply.senderId,
            fname: cachedReply.senderName,
          },
          file: fileUrl ? {
            name: 'image',
            size: 0,
            data: fileUrl,
            ext: cachedReply.fileType || 'image',
          } : undefined,
          createdAt: new Date(cachedReply.createdAt).toISOString(),
        } as UserMessage;
      }
    } catch (error) {
      console.error('❌ Failed to resolve reply message:', error);
    }
    
    // If still not found, return a placeholder with the ID for reference
    return {
      content: {
        id: replyToId,
        message: '[Message not available]',
      },
      messageType: MessageType.USER,
      sender: {
        id: 'unknown',
        fname: 'Unknown User',
      },
      createdAt: new Date().toISOString(),
    } as UserMessage;
  }, []);

  // Helper function to transform cached messages with proper reply resolution
  const transformCachedMessages = useCallback(async (cachedMessages: any[]): Promise<GroupMessage[]> => {
    const transformedMessages: GroupMessage[] = [];
    
    for (const msg of cachedMessages) {
      // Don't modify the display message for regular messages - only use "📷 Image" for replies
      const messageContent = msg.content;
      
      const baseMessage = {
        content: {
          id: msg.serverId || msg.id,
          message: messageContent,
        },
        createdAt: new Date(msg.createdAt).toISOString(),
      };

      if (msg.senderId === 'system') {
        transformedMessages.push({
          messageType: MessageType.ALERT,
          ...baseMessage,
          sender: {
            id: 'system',
            fname: 'System',
          },
        } as AlertMessage);
      } else {
        // Resolve reply message if exists
        const replyingTo = msg.replyToId ? await resolveReplyMessage(msg.replyToId, cachedMessages) : undefined;
        
        transformedMessages.push({
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
          replyingTo,
        } as UserMessage);
      }
    }
    
    return transformedMessages;
  }, [resolveReplyMessage]);

  const loadCachedMessages = useCallback(async (): Promise<GroupMessage[]> => {
    const asyncMessages = await asyncStorageDB.getMessages(groupId);
    return transformCachedMessages(asyncMessages);
  }, [groupId, transformCachedMessages]);
  
  // Load cached messages immediately and synchronously set initial data
  useEffect(() => {
    const loadInitialCache = async () => {
      if (!groupId || initialCacheLoaded) return;
      
      try {
        console.log('📦 Loading initial cached messages for group:', groupId);
        
        let cachedMessages: GroupMessage[] = [];
        
        const asyncMessages = await asyncStorageDB.getMessages(groupId);
        
        if (asyncMessages.length === 0) {
          console.log('⚠️ No cached messages found, attempting backup restore for group:', groupId);
          const backupMessages = await asyncStorageDB.restoreMessageBackup(groupId);
          if (backupMessages.length > 0) {
            cachedMessages = await transformCachedMessages(backupMessages);
            console.log('✅ Restored', cachedMessages.length, 'messages from backup');
          }
        } else {
          cachedMessages = await transformCachedMessages(asyncMessages);
        }
        
        if (cachedMessages.length > 0) {
          console.log('✅ Setting initial cache data:', cachedMessages.length, 'messages for group:', groupId);
          
          // Set initial data immediately to prevent empty state
          queryClient.setQueryData<GroupMessage[]>(
            ['groups', 'messages', groupId],
            cachedMessages
          );
        }
        
        setInitialCacheLoaded(true);
      } catch (error) {
        console.error('❌ Failed to load initial cached messages for group:', groupId, error);
        setInitialCacheLoaded(true); // Still mark as loaded to prevent infinite loop
      }
    };

    loadInitialCache();
  }, [groupId, queryClient, transformCachedMessages]); // Remove initialCacheLoaded from deps to prevent re-runs

  // Enhanced React Query to fetch and cache messages with immediate cache loading
  const { data: messages = [], isLoading, error, isFetching } = useQuery({
    queryKey: ['groups', 'messages', groupId],
    queryFn: async (): Promise<GroupMessage[]> => {
      console.log('🔄 Fetching fresh messages for group:', groupId);
      setIsRefreshing(true);
      
      if (!socket || !user) {
        console.log('⚠️ No socket or user available');
        try {
          return await loadCachedMessages();
        } finally {
          setIsRefreshing(false);
        }
      }

      return new Promise((resolve) => {
        let finished = false;
        let timeout: ReturnType<typeof setTimeout> | undefined;

        const finish = (result: GroupMessage[]) => {
          if (finished) return;
          finished = true;
          setIsRefreshing(false);
          resolve(result);
        };

        const normalizeMessagesFromJoinPayload = (data: any): GroupMessage[] => {
          const messagesFrom =
            data?.messages ??
            data?.data?.messages ??
            data?.payload?.messages ??
            data?.room?.messages ??
            data?.result?.messages ??
            data?.response?.messages;

          if (Array.isArray(messagesFrom)) {
            return messagesFrom as GroupMessage[];
          }
          return [];
        };

        const handleJoinRoom = async (data: any) => {
          if (timeout) clearTimeout(timeout);
          cleanup();
          
          const freshMessages = normalizeMessagesFromJoinPayload(data);
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
              
              // CRITICAL FIX: Create backup after saving fresh messages
              await asyncStorageDB.createMessageBackup(groupId);
            }
          } catch (error) {
            console.error('❌ Failed to save fresh messages to cache:', error);
          }
          
          finish(freshMessages);
        };

        const handleError = async (error: any) => {
          if (timeout) clearTimeout(timeout);
          console.error('❌ Socket error for group:', groupId, error);
          cleanup();
          
          // CRITICAL FIX: Load cached messages instead of returning empty array
          try {
            const cachedMessages = await loadCachedMessages();
            console.log('✅ Socket error - returning', cachedMessages.length, 'cached messages');
            finish(cachedMessages);
          } catch (cacheError) {
            console.error('❌ Failed to load cached messages on error:', cacheError);
            finish([]); // Only return empty if cache loading fails
          }
        };

        const emitJoin = () => {
          try {
            socket.emit(
              SocketEvents.JOIN_GROUP_ROOM,
              {
                roomID: groupId,
                userID: user.id,
              },
              (ack: any) => {
                if (!ack) return;
                handleJoinRoom(ack);
              }
            );
          } catch (e) {
            handleError(e);
          }
        };

        const cleanup = () => {
          socket.off(SocketEvents.JOIN_GROUP_ROOM, handleJoinRoom as any);
          socket.off('joinGroupRoom', handleJoinRoom as any);
          socket.off('joinedGroupRoom', handleJoinRoom as any);
          socket.off('groupRoomJoined', handleJoinRoom as any);
          socket.off('groupMessages', handleJoinRoom as any);
          socket.off('groupRoomMessages', handleJoinRoom as any);
          socket.off(SocketEvents.ERROR, handleError as any);
          socket.off('error', handleError as any);
          socket.off(SocketEvents.CONNECT, emitJoin as any);
          socket.off('connect', emitJoin as any);
        };

        timeout = setTimeout(async () => {
          console.log('⏰ Socket timeout for group:', groupId, '- Loading cached messages instead');
          cleanup();
          
          try {
            const cachedMessages = await loadCachedMessages();
            console.log('✅ Socket timeout - returning', cachedMessages.length, 'cached messages');
            finish(cachedMessages);
          } catch (error) {
            console.error('❌ Failed to load cached messages on timeout:', error);
            finish([]);
          }
        }, 15000);

        [
          SocketEvents.JOIN_GROUP_ROOM,
          'joinGroupRoom',
          'joinedGroupRoom',
          'groupRoomJoined',
          'groupMessages',
          'groupRoomMessages',
        ].forEach((evt) => socket.on(evt as any, handleJoinRoom));

        [SocketEvents.ERROR, 'error'].forEach((evt) =>
          socket.on(evt as any, handleError)
        );
        
        if (socket.connected) {
          emitJoin();
        } else {
          socket.once(SocketEvents.CONNECT as any, emitJoin);
          socket.once('connect' as any, emitJoin);
          try {
            socket.connect?.();
          } catch {}
        }
      });
    },
    enabled: !!groupId && initialCacheLoaded, // Wait for initial cache to load
    staleTime: 1000 * 60 * 2, // Consider data stale after 2 minutes
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 2,
    // CRITICAL FIX: Only merge fresh data if it's actually newer/different
    placeholderData: (previousData) => {
      // Always keep previous data to prevent empty states
      return previousData;
    },
    refetchOnWindowFocus: false, // Don't refetch on focus to avoid interrupting user
    refetchOnReconnect: false, // CRITICAL FIX: Disable auto-refetch on reconnect to prevent clearing cache
  });

  // Post-process messages to resolve any missing reply content and preload images
  useEffect(() => {
    const processMessages = async () => {
      if (!messages || messages.length === 0) return;
      
      let hasUnresolvedReplies = false;
      const updatedMessages: GroupMessage[] = [];
      
      // Collect image messages for preloading
      const imageMessages: any[] = [];
      
      for (const message of messages) {
        if (message.messageType === MessageType.USER) {
          const userMessage = message as UserMessage;
          
          // Collect images for preloading
          if (userMessage.file?.data) {
            imageMessages.push({
              id: userMessage.content.id,
              file: userMessage.file,
            });
          }
          
          // Check if reply needs resolution (has replyingTo but with empty content)
          if (userMessage.replyingTo && 
              (!userMessage.replyingTo.content.message || 
               userMessage.replyingTo.content.message === '' ||
               userMessage.replyingTo.content.message === '[Message not available]')) {
            
            hasUnresolvedReplies = true;
            const resolvedReply = await resolveReplyMessage(userMessage.replyingTo.content.id, messages);
            
            updatedMessages.push({
              ...userMessage,
              replyingTo: resolvedReply,
            });
          } else {
            updatedMessages.push(message);
          }
        } else {
          updatedMessages.push(message);
        }
      }
      
      // Preload message images in background
      if (imageMessages.length > 0) {
        console.log('🖼️ Preloading', imageMessages.length, 'message images for group:', groupId);
        MessageImageCacheUtils.preloadChatImages(imageMessages, groupId).catch((error: any) => {
          console.warn('⚠️ Some message images failed to preload:', error);
        });
      }
      
      // Only update if we found and resolved replies
      if (hasUnresolvedReplies) {
        console.log('🔄 Resolved reply references for', updatedMessages.length, 'messages');
        queryClient.setQueryData<GroupMessage[]>(
          ['groups', 'messages', groupId],
          updatedMessages
        );
      }
    };
    
    processMessages();
  }, [messages, groupId, queryClient, resolveReplyMessage]);

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
      
      // Don't modify the display message for regular messages - only use "📷 Image" for replies
      const displayMessage = contentMessage;
      
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
                
                // CRITICAL FIX: Create backup after adding new message
                await asyncStorageDB.createMessageBackup(groupId);
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
      // Don't modify the display message for regular messages - only use "📷 Image" for replies
      const displayMessage = message.trim();
      
      const payload: SendMessagePayload = {
        roomID: groupId,
        messageType: MessageType.USER,
        content: {
          id: messageId,
          message: displayMessage,
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
              content: message.trim(),
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
      
      // Determine how many unread messages existed for this group before clearing
      const matchedLists = queryClient.getQueriesData<Group[]>({ queryKey: groupsKeys.lists() });
      let previousUnread = 0;
      for (const [, groups] of matchedLists) {
        const found = (groups || []).find(g => String(g.id) === String(groupId));
        if (found) {
          previousUnread = Number(found.unread || 0);
          break;
        }
      }

      // Update groups cache to reset unread count
      queryClient.setQueriesData<Group[]>(
        { queryKey: groupsKeys.lists() }, 
        (old) => {
          if (!old) return old as any;
          return old.map(g => (g.id === groupId ? { ...g, unread: 0 } : g));
        }
      );

      // Decrement footer badge by the group's previous unread count
      if (previousUnread > 0) {
        const { groupNotifications, setNotifications } = useNotificationStore.getState();
        const newCount = Math.max(0, Number(groupNotifications || 0) - previousUnread);
        setNotifications({ groupNotifications: newCount });
      }
      
      // Invalidate groups queries to refresh
      CacheUtils.invalidateAll();
    } catch (err) {
      console.error('❌ Failed to mark messages as read:', err);
      
      const status = (err as any)?.response?.status;
      const isNetworkLikeFailure = !status;
      if (!isNetworkLikeFailure) return;

      const now = Date.now();
      if (now - lastQueuedReadAtRef.current < 30000) return;
      lastQueuedReadAtRef.current = now;

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
    clearError: () => {
      // CRITICAL FIX: Don't reset queries as it clears all cached messages
      // Instead, just invalidate to refetch while keeping cache
      queryClient.invalidateQueries({ queryKey: ['groups', 'messages', groupId] });
    },
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
