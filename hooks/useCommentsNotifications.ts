import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useAuthStore } from '@/state/authStore';
import { useNotificationStore } from '@/state/notificationStore';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

interface Comment {
  id: string;
  commenterID: string;
  tarpPostImgID: string;
  message: string;
  replyingToID: string | null;
  createdAt: string;
  updatedAt: string;
  tarpPostImg: {
    id: string;
    url: string;
    postID: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  commenter: {
    id: string;
    fname: string;
    lname?: string;
    bgUrl?: string;
  };
}

interface CommentsResponse {
  status: string;
  data: Comment[];
}

const LAST_COMMENTS_CHECK_KEY = 'last_comments_check';
const SEEN_COMMENTS_KEY = 'seen_comments';

export const useCommentsNotifications = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { setNotifications } = useNotificationStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentsCount, setNewCommentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch comments from API
  const fetchComments = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('🔔 Not authenticated, cannot fetch comments');
      return [];
    }

    try {
      setIsLoading(true);
      console.log('🔔 Fetching comments from:', UrlConstants.fetchComments);
      
      const response = await api.get<CommentsResponse>(UrlConstants.fetchComments);
      
      console.log('🔔 Comments API response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        // Filter out comments where tarpPostImg is deleted
        const activeComments = response.data.data.filter(comment => !comment.tarpPostImg.deletedAt);
        console.log('✅ Comments fetched successfully:', activeComments.length, 'active out of', response.data.data.length, 'total');
        console.log('📋 Comments data:', activeComments.map(c => ({
          id: c.id,
          message: c.message.substring(0, 30) + '...',
          commenterName: c.commenter.fname + ' ' + (c.commenter.lname || ''),
          createdAt: c.createdAt,
          isReply: !!c.replyingToID
        })));
        
        setComments(activeComments);
        return activeComments;
      } else {
        console.log('⚠️ No comments data found or invalid response structure');
        console.log('Response status:', response.data.status);
        console.log('Response data type:', typeof response.data.data);
        setComments([]);
        return [];
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch comments:', error);
      
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        console.log('⚠️ Rate limited - will retry later');
        return [];
      }
      
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setComments([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Check for new comments and update notification count
  const checkForNewComments = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('🔔 Not authenticated, skipping comments check');
      return;
    }

    try {
      console.log('🔔 Checking for new comments...');
      const currentComments = await fetchComments();
      if (currentComments.length === 0) {
        console.log('🔔 No comments found from API');
        return;
      }

      console.log('🔔 Current comments count:', currentComments.length);
      console.log('🔔 Comments list:', currentComments.map(c => `${c.commenter.fname}: ${c.message.substring(0, 20)}...`));

      // Get the last check timestamp and seen comments
      const lastCheckTime = await SecureStore.getItemAsync(LAST_COMMENTS_CHECK_KEY);
      const seenCommentsData = await SecureStore.getItemAsync(SEEN_COMMENTS_KEY);
      const seenComments = seenCommentsData ? JSON.parse(seenCommentsData) : [];

      console.log('🔔 Last check time:', lastCheckTime);
      console.log('🔔 Seen comments:', seenComments.length);

      let newComments: Comment[] = [];

      if (lastCheckTime) {
        // Find comments added since last check
        const lastCheck = new Date(lastCheckTime);
        newComments = currentComments.filter(comment => {
          const commentDate = new Date(comment.createdAt);
          const isNew = commentDate > lastCheck && !seenComments.includes(comment.id);
          console.log(`🔔 Comment by ${comment.commenter.fname}: created ${commentDate.toISOString()}, lastCheck ${lastCheck.toISOString()}, isNew: ${isNew}`);
          return isNew;
        });
      } else {
        // First time checking - show all comments that haven't been dismissed
        console.log('🔔 First time checking comments, filtering out dismissed ones');
        newComments = currentComments.filter(comment => !seenComments.includes(comment.id));
        console.log('🔔 Showing as new (after filtering dismissed):', newComments.map(c => `${c.commenter.fname}: ${c.message.substring(0, 20)}...`));
      }

      console.log('🔔 New comments detected:', newComments.length);

      if (newComments.length > 0) {
        console.log('🔔 Processing new comments:', newComments.map(c => `${c.commenter.fname}: ${c.message.substring(0, 20)}...`));
        
        // Update local notification count
        setNewCommentsCount(prev => {
          const newCount = prev + newComments.length;
          console.log('🔔 Updating comments count from', prev, 'to', newCount);
          return newCount;
        });
        
        // Update notification store
        setNotifications({
          commentsNotifications: newComments.length
        });

        // DON'T automatically mark as seen - let user dismiss them manually
        console.log('🔔 New comments ready to show - NOT marking as seen automatically');
      } else {
        console.log('🔔 No new comments to show');
      }

      // Update last check time only if we processed notifications
      if (newComments.length > 0 || !lastCheckTime) {
        await SecureStore.setItemAsync(LAST_COMMENTS_CHECK_KEY, new Date().toISOString());
        console.log('🔔 Updated last check time');
      }

    } catch (error) {
      console.error('❌ Failed to check for new comments:', error);
    }
  }, [isAuthenticated, user?.id, setNotifications]);

  // Mark comments as seen (when user views notifications)
  const markCommentsAsSeen = useCallback(async () => {
    try {
      if (comments.length > 0) {
        const allCommentIds = comments.map(c => c.id);
        await SecureStore.setItemAsync(SEEN_COMMENTS_KEY, JSON.stringify(allCommentIds));
        setNewCommentsCount(0);
        
        // Clear comments notifications in store
        setNotifications({
          commentsNotifications: 0
        });
        
        console.log('✅ All comments marked as seen');
      }
    } catch (error) {
      console.error('❌ Failed to mark comments as seen:', error);
    }
  }, [comments, setNotifications]);

  // Get recent comments (last 10) - with better error handling and debugging
  const getRecentComments = useCallback(async () => {
    try {
      console.log('🔍 getRecentComments called - total comments:', comments.length);
      
      if (comments.length === 0) {
        console.log('⚠️ No comments data available - trying to fetch...');
        const freshComments = await fetchComments();
        if (freshComments.length === 0) {
          return [];
        }
        console.log('✅ Got fresh comments data:', freshComments.length);
      }
      
      const commentsToFilter = comments.length > 0 ? comments : await fetchComments();
      
      // Check SecureStore for dismissed comments
      let seenComments = [];
      try {
        const seenCommentsData = await SecureStore.getItemAsync(SEEN_COMMENTS_KEY);
        seenComments = seenCommentsData ? JSON.parse(seenCommentsData) : [];
        console.log('📱 SecureStore - dismissed comments:', seenComments.length);
      } catch (storeError) {
        console.log('⚠️ SecureStore error, showing all comments:', storeError);
        seenComments = [];
      }
      
      // Filter out dismissed comments
      const filteredComments = commentsToFilter.filter(comment => {
        const isDismissed = seenComments.includes(comment.id);
        if (isDismissed) {
          console.log('🚫 Filtering out dismissed comment:', comment.id, 'by', comment.commenter.fname);
        }
        return !isDismissed;
      });
      
      console.log('✅ Final result - showing comments:', filteredComments.length, 'out of', commentsToFilter.length);
      
      // Log the comments we're showing
      if (filteredComments.length > 0) {
        console.log('💬 Comments to show:', filteredComments.map(c => `${c.commenter.fname}: ${c.message.substring(0, 20)}...`));
      }
      
      return filteredComments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
    } catch (error) {
      console.error('❌ Error in getRecentComments:', error);
      return comments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
    }
  }, [comments, fetchComments]);

  // Check if a comment is unseen (for UI display)
  const isCommentUnseen = useCallback(async (commentId: string) => {
    try {
      const seenCommentsData = await SecureStore.getItemAsync(SEEN_COMMENTS_KEY);
      const seenComments = seenCommentsData ? JSON.parse(seenCommentsData) : [];
      return !seenComments.includes(commentId);
    } catch (error) {
      return true;
    }
  }, []);

  // Dismiss a specific comment notification - save to SecureStore
  const dismissComment = useCallback(async (commentId: string) => {
    try {
      // Add to seen comments list in SecureStore
      const seenCommentsData = await SecureStore.getItemAsync(SEEN_COMMENTS_KEY);
      const seenComments = seenCommentsData ? JSON.parse(seenCommentsData) : [];
      
      if (!seenComments.includes(commentId)) {
        const updatedSeenComments = [...seenComments, commentId];
        await SecureStore.setItemAsync(SEEN_COMMENTS_KEY, JSON.stringify(updatedSeenComments));
        
        console.log('✅ Comment dismissed and saved to SecureStore:', commentId);
        console.log('📱 Total dismissed comments:', updatedSeenComments.length);
      }
      
      // Update local state
      setNewCommentsCount(prev => Math.max(0, prev - 1));
      
      // Update notification store
      setNotifications({
        commentsNotifications: Math.max(0, newCommentsCount - 1)
      });
    } catch (error) {
      console.error('❌ Failed to dismiss comment:', error);
    }
  }, [newCommentsCount, setNotifications]);

  // Initialize and set up polling
  useEffect(() => {
    if (isAuthenticated && user) {
      // Initial check with delay to avoid immediate rate limiting
      const initialTimeout = setTimeout(checkForNewComments, 5000);

      const interval = setInterval(checkForNewComments, 30000);

      return () => {
        clearTimeout(initialTimeout);
        clearInterval(interval);
      };
    } else {
      // Clear data when not authenticated
      setComments([]);
      setNewCommentsCount(0);
    }
  }, [isAuthenticated, user?.id]);

  // Pre-populate seen items with current API data (call this on app initialization)
  const initializeSeenComments = useCallback(async (currentComments: Comment[]) => {
    try {
      const existingSeenData = await SecureStore.getItemAsync(SEEN_COMMENTS_KEY);
      const existingSeenIds = existingSeenData ? JSON.parse(existingSeenData) : [];
      
      // Add all current comment IDs to seen list if not already there
      const allCurrentIds = currentComments.map(c => c.id);
      const newSeenIds = [...new Set([...existingSeenIds, ...allCurrentIds])];
      
      await SecureStore.setItemAsync(SEEN_COMMENTS_KEY, JSON.stringify(newSeenIds));
      console.log('✅ Initialized seen comments with', newSeenIds.length, 'items');
    } catch (error) {
      console.error('❌ Failed to initialize seen comments:', error);
    }
  }, []);

  // Clear stored data for testing
  const clearStoredData = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(LAST_COMMENTS_CHECK_KEY);
      await SecureStore.deleteItemAsync(SEEN_COMMENTS_KEY);
      setNewCommentsCount(0);
      
      // Clear comments notifications in store
      setNotifications({
        commentsNotifications: 0
      });
      
      console.log('✅ Cleared stored comments data - refetching data...');
      
      // Refetch comments data after clearing storage
      console.log('🔄 Refetching comments data...');
      await fetchComments();
    } catch (error) {
      console.error('❌ Failed to clear stored data:', error);
    }
  }, [setNotifications, fetchComments]);

  // Debug function to check what's in SecureStore
  const checkSecureStore = useCallback(async () => {
    try {
      const seenCommentsData = await SecureStore.getItemAsync(SEEN_COMMENTS_KEY);
      const seenComments = seenCommentsData ? JSON.parse(seenCommentsData) : [];
      console.log('📱 SecureStore - Dismissed comments:', seenComments);
      return seenComments;
    } catch (error) {
      console.error('❌ Failed to check SecureStore:', error);
      return [];
    }
  }, []);

  return {
    comments,
    newCommentsCount,
    isLoading,
    fetchComments,
    checkForNewComments,
    markCommentsAsSeen,
    getRecentComments,
    isCommentUnseen,
    dismissComment,
    initializeSeenComments,
    checkSecureStore,
    clearStoredData,
  };
};
