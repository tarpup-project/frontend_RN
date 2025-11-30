import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/state/authStore';
import { api } from '@/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { UrlConstants } from '@/constants/apiUrls';
import { 
  GroupMessage, 
  UserMessage, 
  AlertMessage, 
  MessageType, 
  SendMessagePayload,
  MessageFile
} from '../types/groups';
import { SocketEvents } from '../types/socket';


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
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuthStore();
  const messagesRef = useRef<GroupMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    console.log('🔍 useGroupMessages effect triggered:', { socket: !!socket, user: !!user, groupId });
  
    if (!socket || !user || !groupId) {
      console.log('❌ Missing dependencies:', { socket: !!socket, user: !!user, groupId: !!groupId });
      return;
    }

    console.log('🔍 Setting up socket listeners for group:', groupId);
    console.log('✅ All dependencies present, setting up socket listeners');

    const joinRoom = () => {
      console.log('📤 Emitting JOIN_GROUP_ROOM:', { roomID: groupId, userID: user.id });
      socket.emit('joinGroupRoom', {  
        roomID: groupId,
        userID: user.id,
      });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.on(SocketEvents.CONNECT, joinRoom);
    }

    const handleJoinRoom = (data: { messages: GroupMessage[] }) => {
      console.log('📥 Received JOIN_GROUP_ROOM response:', data);
      setMessages(data.messages || []);
      setIsLoading(false);
      setError(null);
    };

    socket.on('joinGroupRoom', handleJoinRoom);

    const handleNewMessage = (data: SendMessagePayload) => {
      if (data.roomID !== groupId) return;

      let newMessage: GroupMessage;
      
      if (data.messageType === MessageType.USER) {
        newMessage = {
          messageType: MessageType.USER,
          content: data.content,
          sender: {
            id: data.sender.id,
            fname: data.sender.fname,
          },
          file: data.file,
          replyingTo: data.replyingTo as UserMessage,
          createdAt: data.createdAt || new Date().toISOString(),
        } as UserMessage;
      } else {
        newMessage = {
          messageType: MessageType.ALERT,
          content: data.content,
          sender: {
            id: data.sender.id,
            fname: data.sender.fname,
          },
          createdAt: data.createdAt || new Date().toISOString(),
        } as AlertMessage;
      }

      setMessages((prevMessages) => {
        const exists = prevMessages.find(msg => msg.content.id === newMessage.content.id);
        if (exists) return prevMessages;
        
        return [...prevMessages, newMessage];
      });
    };

    socket.on(SocketEvents.GROUP_ROOM_MESSAGE, handleNewMessage);

    const handleError = (data: { message: string }) => {
      setError(data.message || 'Connection error');
    };

    socket.on(SocketEvents.ERROR, handleError);

    return () => {
      socket.off(SocketEvents.CONNECT, joinRoom);
      socket.off(SocketEvents.JOIN_GROUP_ROOM, handleJoinRoom);
      socket.off(SocketEvents.GROUP_ROOM_MESSAGE, handleNewMessage);
      socket.off(SocketEvents.ERROR, handleError);
    };
  }, [socket, user, groupId]);

  const sendMessage = useCallback(async ({ 
    message, 
    file, 
    replyingTo 
  }: SendMessageOptions): Promise<boolean> => {
    if (!socket || !user || (!message.trim() && !file)) {
      return false;
    }

    setIsSending(true);
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
        content: payload.content,
        sender: payload.sender,
        file,
        replyingTo,
      };

      setMessages(prev => [...prev, optimisticMessage]);

      return new Promise((resolve) => {
        socket.emit(SocketEvents.GROUP_ROOM_MESSAGE, payload, (response: any) => {
          if (response.status === 'ok') {
            setMessages(prev => prev.map(msg => 
              msg.content.id === messageId 
                ? { ...msg, createdAt: new Date().toISOString() }
                : msg
            ));
            resolve(true);
          } else {
            setMessages(prev => prev.filter(msg => msg.content.id !== messageId));
            setError('Failed to send message');
            resolve(false);
          }
          setIsSending(false);
        });
      });
    } catch (err) {
      setError('Failed to send message');
      setIsSending(false);
      return false;
    }
  }, [socket, user, groupId]);

  const markAsRead = useCallback(async () => {
    try {
      await api.post(UrlConstants.markGroupMessageAsRead(groupId));
      queryClient.invalidateQueries({ queryKey: ['groups'] });      
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [groupId, queryClient]);


  const scrollToMessage = useCallback((messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.content.id === messageId);
    return messageIndex;
  }, [messages]);
  

  return {
    messages,
    isLoading,
    error,
    isSending,
    sendMessage,
    markAsRead,
    scrollToMessage,
    clearError: () => setError(null),
    retryConnection: () => {
      setError(null);
      setIsLoading(true);
    },
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