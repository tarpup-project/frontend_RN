import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useAuthStore } from "@/state/authStore";
import { useNotificationStore } from "@/state/notificationStore";
import { useEffect } from "react";

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
    friendPostsNotifications,
    postLikesNotifications,
    commentsNotifications,
  } = useNotificationStore();

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
        });
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initial fetch with delay to avoid immediate rate limiting
      const initialTimeout = setTimeout(async () => {
        fetchNotifications();
      }, 1000);

      return () => clearTimeout(initialTimeout);
    } else {
      setNotifications({
        groupNotifications: 0,
        personalNotifications: 0,
        chatNotifications: 0,
      });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // All notification polling disabled - notifications header is now blank
    console.log('⚠️ All notification polling disabled');
  }, [isAuthenticated, user]);

  return {
    groupNotifications,
    personalNotifications,
    chatNotifications,
    followerNotifications,
    friendPostsNotifications,
    postLikesNotifications,
    commentsNotifications,
    refetchNotifications: fetchNotifications,
  };
};
