import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useAuthStore } from '@/state/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
    AlertMessage,
    GroupMessage,
    MessageFile,
    MessageType,
    SendMessagePayload,
    UserMessage
} from '../types/groups';
import { SocketEvents } from '../types/socket';

// --- Types ---

interface UseGroupMessagesResult {
  messages: GroupMessage[];
  isLoading: boolean;
  error: Error | null;
  isRefetching: boolean;
  refetch: () => void;
  joinGroupRoom: () => void;
}

interface UseSendGroupMessageResult {
  sendMessage: (options: SendMessageOptions) => Promise<boolean>;
  isSending: boolean;
}

interface SendMessageOptions {
  message: string;
  file?: MessageFile;
  replyingTo?: UserMessage;
}

interface UseMessageReplyResult {
  replyingTo: UserMessage | undefined;
  startReply: (message: UserMessage) => void;
  cancelReply: () => void;
}

// --- Fetch Messages Function ---
const fetchGroupMessages = async (groupId: string): Promise<GroupMessage[]> => {
  console.log('🔄 Fetching messages from API for group:', groupId);

  try {
    const endpoint = UrlConstants.fetchGroupMessages(groupId);
    console.log('📡 API endpoint:', endpoint);
    
    const response = await api.get(endpoint);

    if (response.data?.status === 'success' && response.data?.data) {
      const rawMessages = response.data.data;
      console.log(`📦 Loaded ${rawMessages.length} messages from API`);

      const formatted = Array.isArray(rawMessages)
        ? rawMessages.map(transformMessageForUI)
        : [];

      return formatted;
    }

    console.log('⚠️ API response format unexpected:', response.data);
    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch messages:', error);
    
    // Log specific error details for debugging
    if (error.response) {
      console.error('📡 Response status:', error.response.status);
      console.error('📡 Response data:', error.response.data);
      console.error('📡 Endpoint called:', UrlConstants.fetchGroupMessages(groupId));
    } else if (error.request) {
      console.error('📡 No response received:', error.request);
    } else {
      console.error('📡 Request setup error:', error.message);
    }
    
    throw error;
  }
};

// --- Query Key ---
export const groupMessageKeys = {
  all: ['groups', 'messages'] as const,
  detail: (groupId: string) => [...groupMessageKeys.all, groupId] as const,
};

// --- Helper Functions ---

const getLastMessageTimestamp = (messages: GroupMessage[]): string | undefined => {
  if (!messages || messages.length === 0) return undefined;

  // Find the most recent message timestamp
  const sortedMessages = [...messages]
    .filter(m => m.createdAt) // Filter out messages without timestamps
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });

  return sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1].createdAt : undefined;
};

const transformMessageForUI = (msg: any): GroupMessage => {
  // Check if it's already in the correct format (from cache maybe)
  if (msg.messageType && msg.content && msg.sender) {
    return msg;
  }

  const contentId = msg.content?.id || msg.id || msg.serverId;
  const sender = msg.sender || msg.user || {};
  const messageContent = msg.content?.message || msg.message || msg.content || '';
  const fileData = msg.file?.data || msg.fileUrl;
  const fileExt = msg.file?.ext || msg.fileType;

  const baseMessage = {
    content: {
      id: contentId,
      message: messageContent
    },
    createdAt: msg.createdAt ? new Date(msg.createdAt).toISOString() : new Date().toISOString()
  };

  if (sender.id === 'system') {
    return {
      messageType: MessageType.ALERT,
      ...baseMessage,
      sender: {
        id: 'system',
        fname: 'System'
      }
    } as AlertMessage;
  }

  // Resolve replyingTo if it exists
  let replyingTo: UserMessage | undefined = undefined;
  if (msg.replyingTo) { // If it's already an object
    if (msg.replyingTo.content) {
      replyingTo = msg.replyingTo as UserMessage;
    } else {
      // Basic ID reference or partial object
      replyingTo = {
        messageType: MessageType.USER,
        content: { id: msg.replyingTo, message: 'Loading...' },
        sender: { id: 'unknown', fname: 'Unknown' },
        createdAt: new Date().toISOString()
      } as UserMessage;
    }
  }

  return {
    messageType: MessageType.USER,
    ...baseMessage,
    sender: {
      id: sender.id || msg.senderId || 'unknown',
      fname: sender.fname || msg.senderName || 'Unknown'
    },
    file: fileData ? {
      name: 'file',
      size: 0,
      data: fileData,
      ext: fileExt || 'image'
    } : undefined,
    replyingTo
  } as UserMessage;
};


// --- Hooks ---

export const useGroupMessages = (groupId: string, socket?: any): UseGroupMessagesResult => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Use React Query to fetch and cache messages
  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
    isFetching: isRefetching
  } = useQuery<GroupMessage[], Error>({
    queryKey: groupMessageKeys.detail(groupId),
    queryFn: () => fetchGroupMessages(groupId),
    enabled: !!groupId && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes - consider data fresh
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    // Keep previous data while loading new data
    placeholderData: (previousData) => {
      if (previousData && previousData.length > 0) {
        console.log('⚡ Using cached messages -', previousData.length, 'messages loaded from cache');
      }
      return previousData;
    },
  });

  // Function to join group room with last message timestamp
  const joinGroupRoom = useCallback(() => {
    if (!socket || !socket.connected || !groupId || !user) return;

    const cachedMessages = queryClient.getQueryData<GroupMessage[]>(
      groupMessageKeys.detail(groupId)
    );

    const lastMessageAt = getLastMessageTimestamp(cachedMessages || []);

    if (lastMessageAt) {
      console.log('📅 Joining group with last message at:', lastMessageAt);
    } else {
      console.log('📅 Joining group - no cached messages, requesting all');
    }

    const joinPayload = {
      roomID: groupId,
      userID: user.id,
      ...(lastMessageAt && { last_message_at: lastMessageAt })
    };

    console.log('📤 Emitting joinGroupRoom with payload:', joinPayload);
    socket.emit(SocketEvents.JOIN_GROUP_ROOM, joinPayload);
  }, [socket, groupId, user, queryClient]);

  // Socket event handlers for real-time updates
  useEffect(() => {
    if (!socket || !groupId || !user) return;

    const dedupAndSort = (merged: GroupMessage[]): GroupMessage[] => {
      // 1) Dedup by content.id, keep the latest by createdAt
      const byId = new Map<string, GroupMessage>();
      for (const m of merged) {
        const id = String(m?.content?.id || '');
        if (!id) continue;
        const prev = byId.get(id);
        if (!prev) {
          byId.set(id, m);
        } else {
          const prevTime = prev.createdAt ? new Date(prev.createdAt).getTime() : 0;
          const curTime = m.createdAt ? new Date(m.createdAt).getTime() : 0;
          if (curTime >= prevTime) {
            byId.set(id, m);
          }
        }
      }
      const idDeduped = Array.from(byId.values());

      // 2) Dedup by composite key (senderId|text|bucket), keep the latest
      const byComposite = new Map<string, GroupMessage>();
      for (const m of idDeduped) {
        const isUser = m.messageType === MessageType.USER;
        const senderId = isUser ? (m as UserMessage).sender.id : 'system';
        const text = String(m?.content?.message || '').trim().toLowerCase();
        const ms = m.createdAt ? new Date(m.createdAt).getTime() : 0;
        const bucket = Math.floor(ms / 5000);
        const composite = `${senderId}|${text}|${bucket}`;
        const prev = byComposite.get(composite);
        if (!prev) {
          byComposite.set(composite, m);
        } else {
          const prevTime = prev.createdAt ? new Date(prev.createdAt).getTime() : 0;
          if (ms >= prevTime) {
            byComposite.set(composite, m);
          }
        }
      }

      const out = Array.from(byComposite.values());
      out.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });
      return out;
    };

    const handleJoinGroup = (response: any) => {
      console.log('⚡️ Socket: Joined room response received');

      // If we get fresh data from socket, update the cache
      const rawMessages = response?.messages || response || [];
      if (Array.isArray(rawMessages) && rawMessages.length > 0) {
        const formatted = rawMessages.map(transformMessageForUI);

        // Merge new messages with existing cache and deduplicate
        queryClient.setQueryData<GroupMessage[]>(
          groupMessageKeys.detail(groupId),
          (oldMessages = []) => {
            const merged = [...oldMessages, ...formatted];
            return dedupAndSort(merged);
          }
        );
      }
    };

    const handleNewMessage = (payload: any) => {
      console.log('⚡️ Socket: New message received', payload?.content?.id || 'unknown ID');
      const msgData = payload.message || payload;

      // Filter by roomID if present in payload
      if (msgData.roomID && msgData.roomID !== groupId) return;

      const newMessage = transformMessageForUI(msgData);

      // Update React Query cache with new message
      queryClient.setQueryData<GroupMessage[]>(
        groupMessageKeys.detail(groupId),
        (oldMessages = []) => {
          const isUserMsg =
            newMessage.messageType === MessageType.USER &&
            String((newMessage as UserMessage).sender.id) === String(user?.id);

          if (isUserMsg) {
            const pendingMatch = oldMessages.find(m =>
              m.messageType === MessageType.USER &&
              String((m as UserMessage).sender.id) === String(user?.id) &&
              (m as UserMessage).content.message.trim() === (newMessage as UserMessage).content.message.trim() &&
              ((m as any).isPending ||
                Math.abs(
                  new Date(m.createdAt || Date.now()).getTime() -
                  new Date(newMessage.createdAt || Date.now()).getTime()
                ) < 60000)
            );
            if (pendingMatch) {
              const replaced = oldMessages.map(m =>
                m.content.id === pendingMatch.content.id ? newMessage : m
              );
              return dedupAndSort(replaced);
            }
          }

          const merged = [...oldMessages, newMessage];
          return dedupAndSort(merged);
        }
      );
    };

    const handleSocketConnect = () => {
      console.log('🔌 Socket connected, joining group room');
      joinGroupRoom();
    };

    // Socket listeners
    socket.on(SocketEvents.JOIN_GROUP_ROOM, handleJoinGroup);
    socket.on('groupRoomMessage', handleNewMessage);
    socket.on('groupMessages', handleNewMessage);
    socket.on('connect', handleSocketConnect);

    // Join group room if socket is already connected
    if (socket.connected) {
      joinGroupRoom();
    }

    return () => {
      socket.off(SocketEvents.JOIN_GROUP_ROOM, handleJoinGroup);
      socket.off('groupRoomMessage', handleNewMessage);
      socket.off('groupMessages', handleNewMessage);
      socket.off('connect', handleSocketConnect);
    };
  }, [socket, groupId, user, queryClient, joinGroupRoom]);

  return {
    messages,
    isLoading,
    error,
    isRefetching,
    refetch,
    joinGroupRoom // Expose for manual reconnection
  };
};

// Deprecated or no-op since logic is moved to useGroupMessages
export const useGroupSocketSubscription = (groupId: string, socket: any) => {
  // Logic merged into useGroupMessages
};

export const useSendGroupMessage = (groupId: string): UseSendGroupMessageResult => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { socket } = require('@/contexts/SocketProvider').useSocket();

  // Import hooks and keys needed for optimistic updates
  const { selectedUniversity } = require('./useCampus').useCampus();
  const { groupsKeys } = require('./useGroups');

  const mutation = useMutation({
    mutationFn: async ({ message, file, replyingTo }: SendMessageOptions) => {
      if (!user) throw new Error("No user");

      const messageId = Date.now().toString() + Math.random().toString(36).slice(2);
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

      // Emit via socket
      if (socket && socket.connected) {
        console.log('📤 Sending message via socket:', messageId);
        socket.emit(SocketEvents.GROUP_ROOM_MESSAGE, payload);
      } else {
        throw new Error("Socket disconnected");
      }

      return true;
    },
    onMutate: async (newMsg) => {
      // Optimistic Update 1: Add message to chat detail cache
      await queryClient.cancelQueries({ queryKey: groupMessageKeys.detail(groupId) });
      const previousMessages = queryClient.getQueryData<GroupMessage[]>(groupMessageKeys.detail(groupId));

      const optimisticId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const optimisticMessage: UserMessage = {
        messageType: MessageType.USER,
        content: { id: optimisticId, message: newMsg.message },
        sender: { id: user?.id || 'me', fname: user?.fname || 'Me' },
        createdAt: new Date().toISOString(),
        file: newMsg.file,
        replyingTo: newMsg.replyingTo,
        isPending: true // Mark as pending for UI feedback
      };

      // Add optimistic message to chat cache
      queryClient.setQueryData<GroupMessage[]>(groupMessageKeys.detail(groupId), (old = []) => {
        return [...old, optimisticMessage];
      });

      // Optimistic Update 2: Update groups list (for Last Message display)
      // We need to update the specific list for the current campus
      const groupListKey = groupsKeys.list(selectedUniversity?.id);
      await queryClient.cancelQueries({ queryKey: groupListKey });
      const previousGroups = queryClient.getQueryData<any[]>(groupListKey);

      if (previousGroups) {
        queryClient.setQueryData<any[]>(groupListKey, (oldGroups = []) => {
          const groupIndex = oldGroups.findIndex(g => g.id === groupId);
          if (groupIndex === -1) return oldGroups;

          const updatedGroup = { ...oldGroups[groupIndex] };

          // Construct optimistic last message
          const lastMsgInfo = {
            content: newMsg.message,
            sender: { id: user?.id, fname: user?.fname },
            senderId: user?.id,
            senderName: user?.fname,
          };

          // Update fields
          updatedGroup.lastMessageAt = new Date().toISOString();
          updatedGroup.lastMessage = lastMsgInfo;
          // Also update rawGroup if it exists (for some UI transformations)
          if (updatedGroup.rawGroup) {
            updatedGroup.rawGroup = {
              ...updatedGroup.rawGroup,
              lastMessageAt: new Date().toISOString(),
              messages: [
                ...(updatedGroup.rawGroup.messages || []),
                {
                  id: optimisticId,
                  content: newMsg.message,
                  sender: { id: user?.id, fname: user?.fname },
                  createdAt: new Date().toISOString()
                }
              ]
            };
          }
          // If the structure has messages array at top level
          if (updatedGroup.messages) {
            updatedGroup.messages = [
              ...(updatedGroup.messages || []),
              {
                id: optimisticId,
                content: newMsg.message,
                sender: { id: user?.id, fname: user?.fname },
                createdAt: new Date().toISOString()
              }
            ];
          }

          // Move to top and update
          const newGroups = [
            updatedGroup,
            ...oldGroups.filter(g => g.id !== groupId)
          ];

          return newGroups;
        });
      }

      console.log('⚡ Added optimistic message to cache:', optimisticId);

      return { previousMessages, previousGroups, optimisticId, groupListKey };
    },
    onSuccess: (result, variables, context) => {
      console.log('✅ Message sent successfully');
      // The real message will come through socket, which will replace the optimistic one
    },
    onError: (err, newMsg, context) => {
      console.error("❌ Failed to send message:", err);

      // Revert optimistic updates on error
      if (context?.previousMessages) {
        queryClient.setQueryData(groupMessageKeys.detail(groupId), context.previousMessages);
      }
      if (context?.previousGroups && context?.groupListKey) {
        queryClient.setQueryData(context.groupListKey, context.previousGroups);
      }

      // Could also show error toast here
    },
    onSettled: () => {
      // Don't invalidate queries to keep UI stable
      // Socket will handle real-time updates
    }
  });

  return {
    sendMessage: mutation.mutateAsync,
    isSending: mutation.isPending
  };
};

export const useMessageReply = (): UseMessageReplyResult => {
  const [replyingTo, setReplyingTo] = useState<UserMessage | undefined>(undefined);

  const startReply = useCallback((message: UserMessage) => {
    setReplyingTo(message);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(undefined);
  }, []);

  return { replyingTo, startReply, cancelReply };
};

// --- Facade for Backward Compatibility (Optional) ---
// Or simply export this as the default if we want to minimize code changes in [id].tsx, 
// but plan said "Refactor group-chat/[id].tsx to use new hooks".
// So we will stick to individual exports mostly, or a composed one.

export const useEnhancedGroupMessages = ({ groupId, socket }: { groupId: string, socket?: any }) => {
  const { messages, isLoading, error, refetch, isRefetching } = useGroupMessages(groupId);

  useGroupSocketSubscription(groupId, socket);

  const { sendMessage, isSending } = useSendGroupMessage(groupId);

  // Additional generic helpers
  const markAsRead = useCallback(() => {
    // Implementation for marking read (emit socket event usually)
    if (socket && groupId) {
      socket.emit('markGroupRead', { groupId });
    }
  }, [socket, groupId]);

  const retryConnection = useCallback(() => {
    refetch();
  }, [refetch]);

  const isCached = !isLoading && messages.length > 0;

  return {
    messages,
    isLoading,
    error: error ? error.message : null,
    sendMessage,
    markAsRead,
    isCached,
    isRefreshing: isRefetching,
    isSending,
    retryConnection
  };
};
