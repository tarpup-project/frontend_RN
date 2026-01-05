import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useAuthStore } from "@/state/authStore";
import { useNotificationStore } from "@/state/notificationStore";
import { useEffect } from "react";
import { useCommentsNotifications } from "./useCommentsNotifications";
import { useFollowerNotifications } from "./useFollowerNotifications";
import { useFriendPostsNotifications } from "./useFriendPostsNotifications";
import { usePostLikesNotifications } from "./usePostLikesNotifications";

interface NotificationResponse {
  groupNotifications: number;
  personalNotification: number;
}

export const useNotifications = () => {
  const { isAuthenticated, user } = useAuthStore();
  const {
    setNotifications,
    groupNotifications,
    personalNotifications,
    chatNotifications,
    followerNotifications,
    postLikesNotifications,
    friendPostsNotifications,
    commentsNotifications,
  } = useNotificationStore();

  // Initialize follower notifications
  const { checkForNewFollowers, initializeSeenFollowers } = useFollowerNotifications();
  
  // Initialize post likes notifications
  const { checkForNewPostLikes, initializeSeenPostLikes } = usePostLikesNotifications();

  // Initialize friend posts notifications
  const { checkForNewFriendPosts, initializeSeenFriendPosts } = useFriendPostsNotifications();

  // Initialize comments notifications
  const { checkForNewComments, initializeSeenComments } = useCommentsNotifications();

  const fetchNotifications = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await api.get<{
        status: string;
        data: NotificationResponse;
      }>(UrlConstants.allNotifications);

      if (response.data.status === "success") {
        setNotifications({
          groupNotifications: response.data.data.groupNotifications,
          personalNotifications: response.data.data.personalNotification,
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error);
      
      // Don't reset notifications on rate limit errors
      if (error.response?.status !== 429) {
        setNotifications({
          groupNotifications: 0,
          personalNotifications: 0,
          chatNotifications: 0,
          followerNotifications: 0,
          postLikesNotifications: 0,
          friendPostsNotifications: 0,
          commentsNotifications: 0,
        });
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initial fetch with delay to avoid immediate rate limiting
      const initialTimeout = setTimeout(async () => {
        fetchNotifications();
        
        // For testing: skip initialization and just check for notifications
        checkForNewFollowers();
        checkForNewPostLikes();
        checkForNewFriendPosts();
        checkForNewComments();
      }, 1000);

      return () => clearTimeout(initialTimeout);
    } else {
      setNotifications({
        groupNotifications: 0,
        personalNotifications: 0,
        chatNotifications: 0,
        followerNotifications: 0,
        postLikesNotifications: 0,
        friendPostsNotifications: 0,
        commentsNotifications: 0,
      });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Temporarily disable polling to debug the disappearing notifications issue
    console.log('⚠️ Polling disabled for debugging');
    
    // // Reduce polling frequency to avoid rate limiting
    // const interval = setInterval(() => {
    //   fetchNotifications();
    //   checkForNewFollowers();
    //   checkForNewPostLikes();
    // }, 60000); // Poll every 1 minute instead of 5 seconds

    // return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  return {
    groupNotifications,
    personalNotifications,
    chatNotifications,
    followerNotifications,
    postLikesNotifications,
    friendPostsNotifications,
    commentsNotifications,
    refetchNotifications: fetchNotifications,
  };
};
