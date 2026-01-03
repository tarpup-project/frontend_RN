import { useAuthStore } from '@/state/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { CacheUtils } from '@/utils/queryClient';
import { watermelonOfflineSyncManager } from '@/utils/watermelonOfflineSync';
import {
    AlertMessage,
    GroupMessage,
    MessageFile,
    MessageType,
    SendMessagePayload,
    UserMessage
} from '../types/groups';
import { SocketEvents } from '../types/socket';
import { groupsKeys } from './useGroups';
import { Group } from '../types/groups';

interface UseGroupMessagesProps {
  groupId: string;
  socket?: any;
}

interface SendMessageOptions {
  message: string;
  file?: MessageFile;
  replyingTo?: UserMessage;
}

export const useGroupMessages = ({ groupId, socket }: UseGroupMessagesProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isSending, setIsSending] = useState(false);
  const socketReadyRef = useRef(false);

  // Enhanced React Query to fetch and cache messages
  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['groups', 'messages', groupId],
    queryFn: async (): Promise<GroupMessage[]> => {
      console.log('🔄 FETCHING messages for group:', groupId);
      
      if (!socket || !user) {
        // If no socket, return empty array (or rely on cached data from previous runs)
        return [];
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log('⏰ Socket timeout');
          // If timeout, we resolve with empty array. 
          // React Query will keep showing old data if available due to placeholderData
          resolve([]);
        }, 15000); 

        const handleJoinRoom = (data: { messages: GroupMessage[] }) => {
          clearTimeout(timeout);
          socket.off('joinGroupRoom', handleJoinRoom);
          
          const freshMessages = data.messages || [];
          console.log('📥 Received fresh messages:', freshMessages.length);
          
          resolve(freshMessages);
        };

        const handleError = (error: any) => {
          clearTimeout(timeout);
          console.error('❌ Socket error:', error);
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
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours (aligned with queryClient defaults)
    retry: 2,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Listen for new messages and update cache with optimistic updates
  useEffect(() => {
    if (!socket || !user || !groupId) return;

    const handleNewMessage = (data: any) => {
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

// export const useGroupMessages = ({ groupId, socket }: UseGroupMessagesProps) => {
//   const queryClient = useQueryClient();
//   const [messages, setMessages] = useState<GroupMessage[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isSending, setIsSending] = useState(false);
//   const { user } = useAuthStore();
//   const messagesRef = useRef<GroupMessage[]>([]);

//   useEffect(() => {
//     messagesRef.current = messages;
//   }, [messages]);

//   useEffect(() => {
//     console.log('🔍 useGroupMessages effect triggered:', { socket: !!socket, user: !!user, groupId });
  
//     if (!socket || !user || !groupId) {
//       console.log('❌ Missing dependencies:', { socket: !!socket, user: !!user, groupId: !!groupId });
//       return;
//     }

//     console.log('🔍 Setting up socket listeners for group:', groupId);
//     console.log('✅ All dependencies present, setting up socket listeners');

//     const joinRoom = () => {
//       console.log('📤 Emitting JOIN_GROUP_ROOM:', { roomID: groupId, userID: user.id });
//       socket.emit('joinGroupRoom', {  
//         roomID: groupId,
//         userID: user.id,
//       });
//     };

//     if (socket.connected) {
//       joinRoom();
//     } else {
//       socket.on(SocketEvents.CONNECT, joinRoom);
//     }

//     const handleJoinRoom = (data: { messages: GroupMessage[] }) => {
//       console.log('📥 Received JOIN_GROUP_ROOM response:', data);
//       setMessages(data.messages || []);
//       setIsLoading(false);
//       setError(null);
//     };

//     socket.on('joinGroupRoom', handleJoinRoom);

//     const handleNewMessage = (data: SendMessagePayload) => {
//       if (data.roomID !== groupId) return;

//       let newMessage: GroupMessage;
      
//       if (data.messageType === MessageType.USER) {
//         newMessage = {
//           messageType: MessageType.USER,
//           content: data.content,
//           sender: {
//             id: data.sender.id,
//             fname: data.sender.fname,
//           },
//           file: data.file,
//           replyingTo: data.replyingTo as UserMessage,
//           createdAt: data.createdAt || new Date().toISOString(),
//         } as UserMessage;
//       } else {
//         newMessage = {
//           messageType: MessageType.ALERT,
//           content: data.content,
//           sender: {
//             id: data.sender.id,
//             fname: data.sender.fname,
//           },
//           createdAt: data.createdAt || new Date().toISOString(),
//         } as AlertMessage;
//       }

//       setMessages((prevMessages) => {
//         const exists = prevMessages.find(msg => msg.content.id === newMessage.content.id);
//         if (exists) return prevMessages;
        
//         return [...prevMessages, newMessage];
//       });
//     };

//     socket.on(SocketEvents.GROUP_ROOM_MESSAGE, handleNewMessage);

//     const handleError = (data: { message: string }) => {
//       setError(data.message || 'Connection error');
//     };

//     socket.on(SocketEvents.ERROR, handleError);

//     return () => {
//       socket.off(SocketEvents.CONNECT, joinRoom);
//       socket.off(SocketEvents.JOIN_GROUP_ROOM, handleJoinRoom);
//       socket.off(SocketEvents.GROUP_ROOM_MESSAGE, handleNewMessage);
//       socket.off(SocketEvents.ERROR, handleError);
//     };
//   }, [socket, user, groupId]);

//   const sendMessage = useCallback(async ({ 
//     message, 
//     file, 
//     replyingTo 
//   }: SendMessageOptions): Promise<boolean> => {
//     if (!socket || !user || (!message.trim() && !file)) {
//       return false;
//     }

//     setIsSending(true);
//     const messageId = Date.now().toString() + Math.random().toString(36);

//     try {
//       const payload: SendMessagePayload = {
//         roomID: groupId,
//         messageType: MessageType.USER,
//         content: {
//           id: messageId,
//           message: message.trim() || '',
//         },
//         file,
//         sender: {
//           id: user.id,
//           fname: user.fname,
//         },
//         replyingTo: replyingTo?.content.id,
//       };

//       const optimisticMessage: UserMessage = {
//         messageType: MessageType.USER,
//         content: payload.content,
//         sender: payload.sender,
//         file,
//         replyingTo,
//       };

//       setMessages(prev => [...prev, optimisticMessage]);

//       return new Promise((resolve) => {
//         socket.emit(SocketEvents.GROUP_ROOM_MESSAGE, payload, (response: any) => {
//           if (response.status === 'ok') {
//             setMessages(prev => prev.map(msg => 
//               msg.content.id === messageId 
//                 ? { ...msg, createdAt: new Date().toISOString() }
//                 : msg
//             ));
//             resolve(true);
//           } else {
//             setMessages(prev => prev.filter(msg => msg.content.id !== messageId));
//             setError('Failed to send message');
//             resolve(false);
//           }
//           setIsSending(false);
//         });
//       });
//     } catch (err) {
//       setError('Failed to send message');
//       setIsSending(false);
//       return false;
//     }
//   }, [socket, user, groupId]);

//   const markAsRead = useCallback(async () => {
//     try {
//       await api.post(UrlConstants.markGroupMessageAsRead(groupId));
//       queryClient.invalidateQueries({ queryKey: ['groups'] });      
//     } catch (err) {
//       console.error('Failed to mark messages as read:', err);
//     }
//   }, [groupId, queryClient]);


//   const scrollToMessage = useCallback((messageId: string) => {
//     const messageIndex = messages.findIndex(msg => msg.content.id === messageId);
//     return messageIndex;
//   }, [messages]);
  

//   return {
//     messages,
//     isLoading,
//     error,
//     isSending,
//     sendMessage,
//     markAsRead,
//     scrollToMessage,
//     clearError: () => setError(null),
//     retryConnection: () => {
//       setError(null);
//       setIsLoading(true);
//     },
//   };
// };
