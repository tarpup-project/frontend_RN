import { useState, useEffect, useCallback, useRef } from 'react';
import { useGroupSocket } from '../contexts/SocketProvider';
import { useAuthStore } from '../state/authStore';
import { api } from '../clients/api';
import { UrlConstants } from '../constants/apiUrls';
import { 
  GroupMessage, 
  UserMessage, 
  AlertMessage, 
  MessageType, 
  SendMessagePayload,
  MessageFile,
  MessageContent
} from '../types/groups';
import { SocketEvents } from '../types/socket';
import { v4 as uuidv4 } from 'uuid';

interface UseGroupMessagesProps {
  groupId: string;
}

interface SendMessageOptions {
  message: string;
  file?: MessageFile;
  replyingTo?: UserMessage;
}

export const useGroupMessages = ({ groupId }: UseGroupMessagesProps) => {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { socket } = useGroupSocket();
  const { user } = useAuthStore();
  const messagesRef = useRef<GroupMessage[]>([]);

  // Keep messages ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Join group room and load message history
  useEffect(() => {
    if (!socket || !user || !groupId) return;

    const joinRoom = () => {
      socket.emit(SocketEvents.JOIN_GROUP_ROOM, {
        roomID: groupId,
        userID: user.id,
      });
    };

    // Join room when socket connects
    if (socket.connected) {
      joinRoom();
    } else {
      socket.on(SocketEvents.CONNECT, joinRoom);
    }

    // Listen for join room response with message history
    const handleJoinRoom = (data: { messages: GroupMessage[] }) => {
      console.log(`📥 Received ${data.messages.length} messages for group ${groupId}`);
      setMessages(data.messages || []);
      setIsLoading(false);
      setError(null);
    };

    socket.on(SocketEvents.JOIN_GROUP_ROOM, handleJoinRoom);

    // Listen for new messages
    const handleNewMessage = (data: SendMessagePayload) => {
      // Only process messages for this group
      if (data.roomID !== groupId) return;

      console.log('📨 New message received:', data);

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
        // Avoid duplicate messages
        const exists = prevMessages.find(msg => msg.content.id === newMessage.content.id);
        if (exists) return prevMessages;
        
        return [...prevMessages, newMessage];
      });
    };

    socket.on(SocketEvents.GROUP_ROOM_MESSAGE, handleNewMessage);

    // Handle socket errors
    const handleError = (data: { message: string }) => {
      console.error('❌ Socket error:', data);
      setError(data.message || 'Connection error');
    };

    socket.on(SocketEvents.ERROR, handleError);

    // Cleanup listeners
    return () => {
      socket.off(SocketEvents.CONNECT, joinRoom);
      socket.off(SocketEvents.JOIN_GROUP_ROOM, handleJoinRoom);
      socket.off(SocketEvents.GROUP_ROOM_MESSAGE, handleNewMessage);
      socket.off(SocketEvents.ERROR, handleError);
    };
  }, [socket, user, groupId]);

  // Send message function
  const sendMessage = useCallback(async ({ 
    message, 
    file, 
    replyingTo 
  }: SendMessageOptions): Promise<boolean> => {
    if (!socket || !user || !message.trim()) {
      return false;
    }

    setIsSending(true);
    const messageId = uuidv4();

    try {
      const payload: SendMessagePayload = {
        roomID: groupId,
        messageType: MessageType.USER,
        content: {
          id: messageId,
          message: message.trim(),
        },
        file,
        sender: {
          id: user.id,
          fname: user.fname,
        },
        replyingTo: replyingTo?.content.id,
      };

      // Optimistically add message to UI
      const optimisticMessage: UserMessage = {
        messageType: MessageType.USER,
        content: payload.content,
        sender: payload.sender,
        file,
        replyingTo,
        // No createdAt means it's pending
      };

      setMessages(prev => [...prev, optimisticMessage]);

      // Send via socket with confirmation
      return new Promise((resolve) => {
        socket.emit(SocketEvents.GROUP_ROOM_MESSAGE, payload, (response: any) => {
          if (response.status === 'ok') {
            // Update the optimistic message with server timestamp
            setMessages(prev => prev.map(msg => 
              msg.content.id === messageId 
                ? { ...msg, createdAt: new Date().toISOString() }
                : msg
            ));
            resolve(true);
          } else {
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(msg => msg.content.id !== messageId));
            setError('Failed to send message');
            resolve(false);
          }
          setIsSending(false);
        });
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      setIsSending(false);
      return false;
    }
  }, [socket, user, groupId]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    try {
      await api.post(UrlConstants.markGroupMessageAsRead(groupId));
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [groupId]);

  // Scroll to message by ID
  const scrollToMessage = useCallback((messageId: string) => {
    // This will be handled by the UI component
    // Return the message index for scrolling
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
    // Utility functions
    clearError: () => setError(null),
    retryConnection: () => {
      setError(null);
      setIsLoading(true);
      // Socket will auto-reconnect
    },
  };
};

// Helper hook for managing message replies
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

// Helper function to format time ago
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