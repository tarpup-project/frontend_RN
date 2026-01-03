import { api } from '@/api/client';
import { asyncStorageDB, isWatermelonAvailable } from '@/database';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { UrlConstants } from '../constants/apiUrls';
import { useAuthStore } from '../state/authStore';
import { useCampus } from './useCampus';
import { usePersonalSocket } from './usePersonalSocket';

export interface PersonalMessage {
  id: string;
  content: string;
  messageType: 'text' | 'markdown';
  sender: 'user' | 'assistant';
  createdAt?: string;
  isRequest?: boolean;
  imageUrl?: string;
}

interface UseEnhancedPersonalChatReturn {
  messages: PersonalMessage[];
  isLoading: boolean;
  isTyping: boolean;
  sendMessage: (message: string) => void;
  markAsRead: () => void;
  clearMessages: () => void;
  isCached: boolean;
  isRefreshing: boolean;
}

const personalChatKeys = {
  all: ['personalChat'] as const,
  messages: () => [...personalChatKeys.all, 'messages'] as const,
};

export const useEnhancedPersonalChat = (): UseEnhancedPersonalChatReturn => {
  const queryClient = useQueryClient();
  const [isTyping, setIsTyping] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { socket } = usePersonalSocket();
  const { user } = useAuthStore();
  const { selectedUniversity } = useCampus();

  // Enhanced React Query with immediate cache loading
  const { data: messages = [], isLoading, isFetching } = useQuery({
    queryKey: personalChatKeys.messages(),
    queryFn: async (): Promise<PersonalMessage[]> => {
      if (!user?.id) {
        throw new Error('User not available');
      }

      console.log('🔄 Fetching fresh personal messages from server...');
      setIsRefreshing(true);

      try {
        const response = await api.get(UrlConstants.fetchPersonalMessageHistory);
        const freshMessages = response.data.data as PersonalMessage[];
        
        console.log('📥 Fetched fresh AI chat messages:', freshMessages.length);
        
        // Save to database for future cache
        if (isWatermelonAvailable) {
          // TODO: Implement WatermelonDB personal messages storage
          console.log('💾 Saving to WatermelonDB (not implemented yet)');
        } else {
          // Save to AsyncStorage
          await asyncStorageDB.saveMessages('personal_chat', freshMessages.map(msg => ({
            ...msg,
            groupId: 'personal_chat',
            serverId: msg.id,
            senderId: msg.sender === 'user' ? user.id : 'assistant',
            senderName: msg.sender === 'user' ? user.fname : 'TarpAI',
            isPending: false,
            isSynced: true,
            createdAt: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
            updatedAt: Date.now(),
          })));
        }
        
        return freshMessages || [];
      } catch (err) {
        console.error('❌ Failed to fetch fresh messages:', err);
        return [];
      } finally {
        setIsRefreshing(false);
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // Consider stale after 2 minutes
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
      if (!user?.id) return;
      
      try {
        console.log('📦 Loading cached personal messages...');
        
        let cachedMessages: PersonalMessage[] = [];
        
        if (isWatermelonAvailable) {
          // TODO: Load from WatermelonDB
          console.log('📦 Loading from WatermelonDB (not implemented yet)');
        } else {
          // Load from AsyncStorage
          const asyncMessages = await asyncStorageDB.getMessages('personal_chat');
          cachedMessages = asyncMessages.map(msg => ({
            id: msg.serverId || msg.id,
            content: msg.content,
            messageType: 'text' as const,
            sender: msg.senderId === user.id ? 'user' as const : 'assistant' as const,
            createdAt: new Date(msg.createdAt).toISOString(),
            isRequest: msg.isRequest,
            imageUrl: msg.fileUrl,
          }));
        }
        
        if (cachedMessages.length > 0) {
          console.log('✅ Loaded', cachedMessages.length, 'cached personal messages');
          
          // Set cached data immediately if no fresh data is available
          queryClient.setQueryData<PersonalMessage[]>(
            personalChatKeys.messages(),
            (currentData) => {
              // Only use cached data if we don't have fresh data yet
              return currentData && currentData.length > 0 ? currentData : cachedMessages;
            }
          );
        }
      } catch (error) {
        console.error('❌ Failed to load cached personal messages:', error);
      }
    };

    loadCachedMessages();
  }, [user?.id, queryClient]);

  // Debug logging
  useEffect(() => {
    const isCached = messages.length > 0 && !isLoading;
    console.log('💬 Enhanced AI Chat State:', {
      messageCount: messages.length,
      isLoading,
      isRefreshing,
      isFetching,
      isCached,
      hasSocket: !!socket
    });
  }, [messages, isLoading, isRefreshing, isFetching, socket]);

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

    // Also save to cache immediately
    const saveToCache = async () => {
      try {
        if (isWatermelonAvailable) {
          // TODO: Save to WatermelonDB
        } else {
          await asyncStorageDB.addMessage('personal_chat', {
            id: userMessage.id,
            serverId: userMessage.id,
            groupId: 'personal_chat',
            content: userMessage.content,
            senderId: user.id,
            senderName: user.fname,
            isPending: true,
            isSynced: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      } catch (error) {
        console.error('❌ Failed to cache user message:', error);
      }
    };
    saveToCache();

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
      
      // Clear from database
      if (isWatermelonAvailable) {
        // TODO: Clear from WatermelonDB
      } else {
        await asyncStorageDB.saveMessages('personal_chat', []);
      }
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
            const updatedMessages = [...old, data];
            
            // Save to database cache
            const saveToCache = async () => {
              try {
                if (isWatermelonAvailable) {
                  // TODO: Save to WatermelonDB
                } else {
                  await asyncStorageDB.addMessage('personal_chat', {
                    id: data.id,
                    serverId: data.id,
                    groupId: 'personal_chat',
                    content: data.content,
                    senderId: 'assistant',
                    senderName: 'TarpAI',
                    isPending: false,
                    isSynced: true,
                    createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
                    updatedAt: Date.now(),
                  });
                }
              } catch (error) {
                console.error('❌ Failed to cache AI message:', error);
              }
            };
            saveToCache();
            
            return updatedMessages;
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
    isCached: messages.length > 0 && !isLoading,
    isRefreshing,
  };
};