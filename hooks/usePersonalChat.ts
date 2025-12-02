import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePersonalSocket } from './usePersonalSocket';
import { useAuthStore } from '../state/authStore';
import { api } from '@/api/client';
import { UrlConstants } from '../constants/apiUrls';
import { useCampus } from './useCampus';

export interface PersonalMessage {
  id: string;
  content: string;
  messageType: 'text' | 'markdown';
  sender: 'user' | 'assistant';
  createdAt?: string;
  isRequest?: boolean;
  imageUrl?: string;
}

interface UsePersonalChatReturn {
  messages: PersonalMessage[];
  isLoading: boolean;
  isTyping: boolean;
  sendMessage: (message: string) => void;
  markAsRead: () => void;
  clearMessages: () => void;
}

const personalChatKeys = {
  all: ['personalChat'] as const,
  messages: () => [...personalChatKeys.all, 'messages'] as const,
};

export const usePersonalChat = (): UsePersonalChatReturn => {
  const queryClient = useQueryClient();
  const [isTyping, setIsTyping] = useState(false);
  const { socket } = usePersonalSocket();
  const { user } = useAuthStore();
  const { selectedUniversity } = useCampus();

  // React Query to fetch and cache messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: personalChatKeys.messages(),
    queryFn: async (): Promise<PersonalMessage[]> => {
      if (!user?.id) {
        throw new Error('User not available');
      }

      try {
        const response = await api.get(UrlConstants.fetchPersonalMessageHistory);
        const result = response.data.data as PersonalMessage[];
        console.log('📥 Fetched AI chat history:', result.length, 'messages');
        return result || [];
      } catch (err) {
        console.error('Failed to fetch message history:', err);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });

  // Debug logging
  useEffect(() => {
    console.log('💬 AI Chat Cache State:', {
      messageCount: messages.length,
      isLoading,
      isCached: messages.length > 0 && !isLoading
    });
  }, [messages, isLoading]);

  const sendMessage = useCallback((message: string) => {
    if (!socket || !user || !message.trim()) return;

    const userMessage: PersonalMessage = {
      id: `user_${Date.now()}`,
      content: message.trim(),
      messageType: 'text',
      sender: 'user',
      createdAt: new Date().toISOString(),
    };

    // Optimistic update - add user message immediately
    queryClient.setQueryData<PersonalMessage[]>(
      personalChatKeys.messages(),
      (old = []) => [...old, userMessage]
    );

    setIsTyping(true);

    socket.emit('messagePersonalRoom', {
      ...userMessage,
      roomID: user.id,
      campusID: selectedUniversity?.id,
      stateID: user?.stateID,      
    });
  }, [socket, user, selectedUniversity?.id, queryClient]);

  const markAsRead = useCallback(async () => {
    try {
      await api.post(UrlConstants.markMessagesAsRead);
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, []);

  const clearMessages = useCallback(async () => {
    try {
      await api.delete(UrlConstants.deletePersonalMessages);
      
      // Clear cache immediately
      queryClient.setQueryData<PersonalMessage[]>(
        personalChatKeys.messages(),
        []
      );
    } catch (err) {
      console.error('Failed to clear messages:', err);
    }
  }, [queryClient]);

  // Listen for socket messages and update cache
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleJoinPersonalRoom = (data: PersonalMessage) => {
      // Only add if cache is empty
      queryClient.setQueryData<PersonalMessage[]>(
        personalChatKeys.messages(),
        (old = []) => {
          if (old.length === 0) {
            return [data];
          }
          return old;
        }
      );
    };

    const handleMessagePersonalRoom = (data: PersonalMessage) => {
      setIsTyping(false);
      
      // Add AI response to cache
      queryClient.setQueryData<PersonalMessage[]>(
        personalChatKeys.messages(),
        (old = []) => {
          // Check if message already exists (avoid duplicates)
          const exists = old.slice(-5).find(msg => msg.id === data.id);
          if (!exists) {
            return [...old, data];
          }
          return old;
        }
      );
    };

    const handleError = (data: { message: string }) => {
      setIsTyping(false);
      console.error('Socket error:', data.message);
    };

    socket.on('joinPersonalRoom', handleJoinPersonalRoom);
    socket.on('messagePersonalRoom', handleMessagePersonalRoom);
    socket.on('error', handleError);

    return () => {
      socket.off('joinPersonalRoom', handleJoinPersonalRoom);
      socket.off('messagePersonalRoom', handleMessagePersonalRoom);
      socket.off('error', handleError);
    };
  }, [socket, user?.id, queryClient]);

  return {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    markAsRead,
    clearMessages,
  };
};




// import { useState, useEffect, useCallback, useRef } from 'react';
// import { usePersonalSocket } from './usePersonalSocket';
// import { useAuthStore } from '../state/authStore';
// import { api } from '@/api/client';
// import { UrlConstants } from '../constants/apiUrls';
// import { useCampus } from './useCampus';

// export interface PersonalMessage {
//   id: string;
//   content: string;
//   messageType: 'text' | 'markdown';
//   sender: 'user' | 'assistant';
//   createdAt?: string;
// }

// interface UsePersonalChatReturn {
//   messages: PersonalMessage[];
//   isLoading: boolean;
//   isTyping: boolean;
//   sendMessage: (message: string) => void;
//   markAsRead: () => void;
//   clearMessages: () => void;
// }

// export const usePersonalChat = (): UsePersonalChatReturn => {
//   const [messages, setMessages] = useState<PersonalMessage[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isTyping, setIsTyping] = useState(false);
//   const { socket } = usePersonalSocket();
//   const { user } = useAuthStore();
//   const { selectedUniversity } = useCampus();

//   const fetchHistory = useCallback(async () => {
//     if (!user?.id) return;
    
//     try {
//       const response = await api.get(UrlConstants.fetchPersonalMessageHistory);
//       const result = response.data.data as PersonalMessage[];
//       setMessages(result || []);
//     } catch (err) {
//       console.error('Failed to fetch message history:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [user?.id]);

//   const sendMessage = useCallback((message: string) => {
//     if (!socket || !user || !message.trim()) return;

//     const messageData: PersonalMessage = {
//       id: `user_${Date.now()}`,
//       content: message.trim(),
//       messageType: 'text',
//       sender: 'user',
//       createdAt: new Date().toISOString(),
//     };

//     setMessages(prev => [...prev, messageData]);
//     setIsTyping(true);

//     socket.emit('messagePersonalRoom', {
//       ...messageData,
//       roomID: user.id,
//       campusID: selectedUniversity?.id,
//       stateID: user?.stateID,      
//     });
//   }, [socket, user, selectedUniversity?.id]);

//   const markAsRead = useCallback(async () => {
//     try {
//       await api.post(UrlConstants.markMessagesAsRead);
//     } catch (err) {
//       console.error('Failed to mark messages as read:', err);
//     }
//   }, []);

//   const clearMessages = useCallback(async () => {
//     try {
//       await api.delete(UrlConstants.deletePersonalMessages);
//       setMessages([]);
//     } catch (err) {
//       console.error('Failed to clear messages:', err);
//     }
//   }, []);

//   useEffect(() => {
//     if (!socket || !user?.id) return;

//     socket.on('joinPersonalRoom', (data: PersonalMessage) => {
//       if (messages.length === 0) {
//         setMessages([data]);
//       }
//     });

//     socket.on('messagePersonalRoom', (data: PersonalMessage) => {
//       setIsTyping(false);
//       setMessages(prev => {
//         const exists = prev.slice(-5).find(msg => msg.id === data.id);
//         if (!exists) {
//           return [...prev, data];
//         }
//         return prev;
//       });
//     });

//     socket.on('error', (data: { message: string }) => {
//       setIsTyping(false);
//       console.error('Socket error:', data.message);
//     });

//     return () => {
//       socket.off('joinPersonalRoom');
//       socket.off('messagePersonalRoom');
//       socket.off('error');
//     };
//   }, [socket, user?.id, messages.length]);

//   useEffect(() => {
//     fetchHistory();
//   }, [fetchHistory]);

//   return {
//     messages,
//     isLoading,
//     isTyping,
//     sendMessage,
//     markAsRead,
//     clearMessages,
//   };
// };