import { api } from '@/api/client';
import { MessageImageCacheUtils } from '@/components/CachedMessageImage';
import { UrlConstants } from '@/constants/apiUrls';
import { asyncStorageDB, database, groupsCollection, isWatermelonAvailable } from '@/database';
import { useAuthStore } from '@/state/authStore';
import { useNotificationStore } from '@/state/notificationStore';
import { CacheUtils } from '@/utils/queryClient';
import { watermelonOfflineSyncManager } from '@/utils/watermelonOfflineSync';
import { Q } from '@nozbe/watermelondb';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
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
  // Add useMemo to imports
  const { useMemo } = require('react');
  const lastQueuedReadAtRef = useRef<number>(0);
  const joinStartRef = useRef<number | null>(null);
  const firstMessageLoggedRef = useRef<boolean>(false);

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
      // If groupId changed, we need to reload cache even if initialCacheLoaded was true
      if (!groupId) return;

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

    // Reset initialCacheLoaded when groupId changes
    setInitialCacheLoaded(false);
    loadInitialCache();

    // CRITICAL FIX: Refetch messages when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App came to foreground, refreshing messages...');
        queryClient.invalidateQueries({ queryKey: ['groups', 'messages', groupId] });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [groupId, queryClient, transformCachedMessages]);

  // Enhanced React Query to fetch and cache messages with immediate cache loading
  const { data: messages = [], isLoading, error, isFetching } = useQuery({
    queryKey: ['groups', 'messages', groupId],
    queryFn: async (): Promise<GroupMessage[]> => {
      console.log('🔄 Fetching fresh messages for group:', groupId);
      setIsRefreshing(true);

      if (!socket || !user) {
        console.log('⚠️ No socket or user available for group:', groupId, 'User:', !!user, 'Socket:', !!socket);
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

        async function handleJoinRoom(data: any) {
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

              // CRITICAL FIX: Use syncMessages instead of saveMessages to MERGE, not OVERWRITE
              await asyncStorageDB.syncMessages(groupId, transformedMessages);
              console.log('💾 Synced', transformedMessages.length, 'fresh messages to AsyncStorage for group:', groupId);

              // CRITICAL FIX: Create backup after saving fresh messages
              await asyncStorageDB.createMessageBackup(groupId);
            }
          } catch (error) {
            console.error('❌ Failed to save fresh messages to cache:', error);
          }

          // Merge fresh messages with existing cache to prevent data loss
          // This is critical if the backend only sends delta messages
          try {
            let currentData = queryClient.getQueryData<GroupMessage[]>(['groups', 'messages', groupId]) || [];

            // CRITICAL FIX: If query cache is empty, ALWAYS try to get from local DB first
            // This prevents overwriting full history with a delta update (single message)
            if (currentData.length === 0) {
              console.log('⚠️ Query cache empty during join, fetching from DB for merge...');
              try {
                const dbMessages = await asyncStorageDB.getMessages(groupId);
                if (dbMessages.length > 0) {
                  currentData = await transformCachedMessages(dbMessages);
                  console.log(`✅ Retrieved ${currentData.length} messages from DB for merge`);
                }
              } catch (dbError) {
                console.error('Failed to fetch from DB for merge:', dbError);
              }
            }

            if (currentData.length > 0) {
              // Logic to merge: 
              // 1. Create a map of existing messages by ID
              // 2. Add/Overwrite with fresh messages
              // 3. Convert back to array
              const messageMap = new Map();

              currentData.forEach(msg => messageMap.set(msg.content.id, msg));
              freshMessages.forEach(msg => messageMap.set(msg.content.id, msg));

              const mergedMessages = Array.from(messageMap.values())
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

              console.log(`✅ Merged ${freshMessages.length} fresh messages with ${currentData.length} cached messages. Total: ${mergedMessages.length}`);
              finish(mergedMessages);
            } else if (freshMessages.length > 0) {
              // If we still have no current data (new install or cleared cache), just use fresh
              console.log(`✅ No cached messages found, using ${freshMessages.length} fresh messages`);
              finish(freshMessages);
            } else {
              // If no fresh messages, keep using cached data
              console.log('✅ No fresh messages, keeping cached data');
              finish(currentData.length > 0 ? currentData : []);
            }
          } catch (e) {
            console.error('Error merging messages:', e);
            finish(freshMessages);
          }
        }

        async function handleError(error: any) {
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
        }

        async function emitJoin() {
          try {
            // Get last message timestamp from cache for delta sync
            let lastMessageAt = 0;
            try {
              if (isWatermelonAvailable) {
                // TODO: Get from WatermelonDB
              } else {
                const cachedMessages = await asyncStorageDB.getMessages(groupId);
                if (cachedMessages.length > 0) {
                  // Messages are sorted by createdAt in getMessages
                  const lastMessage = cachedMessages[cachedMessages.length - 1];
                  // Use createdAt or updatedAt, whichever is newer
                  lastMessageAt = Math.max(lastMessage.createdAt || 0, lastMessage.updatedAt || 0);
                }
              }
            } catch (err) {
              console.warn('⚠️ Failed to get last message timestamp for join:', err);
            }

            // Convert to ISO string for backend
            // CRITICAL FIX: Strictly send null if no cache exists or lastMessageAt is 0
            const lastMessageAtISO = (lastMessageAt && lastMessageAt > 0) ? new Date(lastMessageAt).toISOString() : null;

            console.log('🔌 Joining room', groupId, 'with last_message_at:', lastMessageAtISO);

            joinStartRef.current = Date.now();
            firstMessageLoggedRef.current = false;
            socket.emit(
              SocketEvents.JOIN_GROUP_ROOM,
              {
                roomID: groupId,
                userID: user!.id,
                last_message_at: lastMessageAtISO, // Send ISO timestamp for delta sync
              },
              (ack: any) => {
                if (!ack) return;
                handleJoinRoom(ack);
              }
            );
          } catch (e) {
            handleError(e);
          }
        }

        function cleanup() {
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
        }

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
          } catch { }
        }
      });
    },
    enabled: !!groupId && initialCacheLoaded, // Wait for initial cache to load
    staleTime: 1000 * 60 * 2, // Consider data stale after 2 minutes
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 2,
    // CRITICAL FIX: Only merge fresh data if it's actually newer/different
    placeholderData: (previousData, previousQuery) => {
      // If we have previous data (from cache or previous fetch), use it
      if (previousData) {
        return previousData;
      }

      // If we don't have previous data, try to get it from the query cache directly
      // This handles the case where setQueryData was called before useQuery initialized
      const cachedData = queryClient.getQueryData<GroupMessage[]>(['groups', 'messages', groupId]);
      if (cachedData) {
        return cachedData;
      }

      return undefined;
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

  // CRITICAL FIX: UI-level deduplication to hide any duplicates that slip through
  const deduplicatedMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];

    // Use a Set to track unique signatures
    const seenSignatures = new Set<string>();
    const uniqueMessages: GroupMessage[] = [];

    // Sort heavily to ensure stable order
    const sorted = [...messages].sort((a, b) => new Date(a.createdAt || Date.now()).getTime() - new Date(b.createdAt || Date.now()).getTime());

    for (const msg of sorted) {
      if (msg.messageType === MessageType.ALERT) {
        uniqueMessages.push(msg);
        continue;
      }

      const userMsg = msg as UserMessage;
      // Signature: SenderID + Content + TimeBucket (2 sec window)
      // This catches messages sent by same person with same text at almost same time
      const timeBucket = Math.floor(new Date(msg.createdAt || Date.now()).getTime() / 2000);
      const signature = `${userMsg.sender.id}_${userMsg.content.message.trim()}_${timeBucket}`;

      // Check for exact ID match too
      const idSignature = `ID_${msg.content.id}`;

      if (!seenSignatures.has(signature) && !seenSignatures.has(idSignature)) {
        seenSignatures.add(signature);
        seenSignatures.add(idSignature);
        uniqueMessages.push(msg);
      }
    }

    return uniqueMessages;
  }, [messages]);

  // Listener for new messages moved to SocketProvider to prevent duplication
  useEffect(() => {
    // Only keeping this for debug/monitoring if needed, but no cache updates
    if (!socket || !user || !groupId) return;

    // Logic moved to SocketProvider.tsx
  }, [socket, user?.id, groupId]);

  const sendMessage = useCallback(async ({
    message,
    file,
    replyingTo
  }: SendMessageOptions): Promise<boolean> => {
    if (!user || (!message.trim() && !file)) {
      return false;
    }

    setIsSending(true);
    // CRITICAL FIX: Use the SAME ID for optimistic update and server payload
    // This prevents duplication when the server broadcasts the message back
    const messageId = Date.now().toString() + Math.random().toString(36).slice(2);

    try {
      // Don't modify the display message for regular messages - only use "📷 Image" for replies
      const displayMessage = message.trim();

      const payload: SendMessagePayload = {
        roomID: groupId,
        messageType: MessageType.USER,
        content: {
          id: messageId, // Use the consistent ID
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
        content: { ...payload.content, id: messageId }, // Use the consistent ID
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
              id: messageId,
              serverId: messageId,
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
          watermelonOfflineSyncManager.addToQueue('message', payload, 3);
        } catch { }

        setIsSending(false);
        return true;
      }

      // Send via socket if online
      return new Promise((resolve) => {
        socket.emit(SocketEvents.GROUP_ROOM_MESSAGE, payload, (response: any) => {
          if (response.status === 'ok') {
            // Mark message as synced (no need to replace ID since it's the same)
            const updateCache = async () => {
              try {
                if (isWatermelonAvailable) {
                  // TODO: Update WatermelonDB
                } else {
                  const messages = await asyncStorageDB.getMessages(groupId);
                  const updatedMessages = messages.map(msg =>
                    msg.id === messageId
                      ? { ...msg, isPending: false, isSynced: true }
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
                const updated = old.filter(msg => msg.content.id !== messageId);
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
                  const filteredMessages = messages.filter(msg => msg.id !== messageId);
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
        (old = []) => old.filter(msg => msg.content.id !== messageId)
      );
      setIsSending(false);
      return false;
    }
  }, [socket, user, groupId, queryClient]);

  const markAsRead = useCallback(async () => {
    try {
      await api.post(UrlConstants.markGroupMessageAsRead(groupId));

      const matchedLists = queryClient.getQueriesData<Group[]>({ queryKey: groupsKeys.lists() });
      let previousUnread = 0;
      for (const [, groups] of matchedLists) {
        const found = (groups || []).find(g => String(g.id) === String(groupId));
        if (found) {
          previousUnread = Number(found.unread || 0);
          break;
        }
      }

      queryClient.setQueriesData<Group[]>(
        { queryKey: groupsKeys.lists() },
        (old) => {
          if (!old) return old as any;
          return old.map(g => (g.id === groupId ? { ...g, unread: 0 } : g));
        }
      );

      if (previousUnread > 0) {
        const { groupNotifications, setNotifications } = useNotificationStore.getState();
        const newCount = Math.max(0, Number(groupNotifications || 0) - previousUnread);
        setNotifications({ groupNotifications: newCount });
      }

      if (isWatermelonAvailable && database && groupsCollection) {
        try {
          const wmGroups = await groupsCollection
            .query(Q.where('server_id', groupId))
            .fetch();

          if (wmGroups.length > 0) {
            await database.write(async () => {
              await wmGroups[0].update((g: any) => {
                g.unreadCount = 0;
              });
            });
          }
        } catch (wmError) {
          console.error('❌ Failed to sync Watermelon unread count:', wmError);
        }
      }

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
      } catch { }
    }
  }, [groupId, queryClient]);



  return {
    messages: deduplicatedMessages, // Return filtered messages
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
    isCached: deduplicatedMessages.length > 0 && !isLoading,
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
