import { useState, useEffect, useCallback, useRef } from 'react';
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
}

interface UsePersonalChatReturn {
  messages: PersonalMessage[];
  isLoading: boolean;
  isTyping: boolean;
  sendMessage: (message: string) => void;
  markAsRead: () => void;
  clearMessages: () => void;
}

export const usePersonalChat = (): UsePersonalChatReturn => {
  const [messages, setMessages] = useState<PersonalMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const { socket } = usePersonalSocket();
  const { user } = useAuthStore();
  const { selectedUniversity } = useCampus();

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await api.get(UrlConstants.fetchPersonalMessageHistory);
      const result = response.data.data as PersonalMessage[];
      setMessages(result || []);
    } catch (err) {
      console.error('Failed to fetch message history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const sendMessage = useCallback((message: string) => {
    if (!socket || !user || !message.trim()) return;

    const messageData: PersonalMessage = {
      id: `user_${Date.now()}`,
      content: message.trim(),
      messageType: 'text',
      sender: 'user',
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, messageData]);
    setIsTyping(true);

    socket.emit('messagePersonalRoom', {
      ...messageData,
      roomID: user.id,
      campusID: selectedUniversity?.id,
    });
  }, [socket, user, selectedUniversity?.id]);

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
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear messages:', err);
    }
  }, []);

  useEffect(() => {
    if (!socket || !user?.id) return;

    socket.on('joinPersonalRoom', (data: PersonalMessage) => {
      if (messages.length === 0) {
        setMessages([data]);
      }
    });

    socket.on('messagePersonalRoom', (data: PersonalMessage) => {
      setIsTyping(false);
      setMessages(prev => {
        const exists = prev.slice(-5).find(msg => msg.id === data.id);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    });

    socket.on('error', (data: { message: string }) => {
      setIsTyping(false);
      console.error('Socket error:', data.message);
    });

    return () => {
      socket.off('joinPersonalRoom');
      socket.off('messagePersonalRoom');
      socket.off('error');
    };
  }, [socket, user?.id, messages.length]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    markAsRead,
    clearMessages,
  };
};