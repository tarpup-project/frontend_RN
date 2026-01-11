import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useAuthStore } from "@/state/authStore";
import { useNotificationStore } from "@/state/notificationStore";
import { useEffect } from "react";
import { AppState } from "react-native";

interface NotificationResponse {
  groupNotifications: number;
  personalNotification: number;
}

export const useNotifications = () => {
  const { isAuthenticated, user } = useAuthStore();
  const {
    groupNotifications,
    personalNotifications,
    chatNotifications,
    followerNotifications,
    friendPostsNotifications,
    postLikesNotifications,
    commentsNotifications,
    pendingMatchesNotifications, // Pending matches notification count
    setNotifications,
    incrementNotification,
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

    // Enable automatic notification polling every 30 seconds for more responsive counters
    console.log('🔄 Starting automatic notification polling');
    
    const interval = setInterval(() => {
      console.log('📊 Fetching notifications automatically');
      fetchNotifications();
    }, 30000); // Poll every 30 seconds

    // Initial fetch after 2 seconds
    const initialTimeout = setTimeout(() => {
      fetchNotifications();
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [isAuthenticated, user]);

  // Listen for app state changes to refresh notifications when app becomes active
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active, refreshing notifications');
        fetchNotifications();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isAuthenticated, user]);

  return {
    groupNotifications,
    personalNotifications,
    chatNotifications,
    followerNotifications,
    friendPostsNotifications,
    postLikesNotifications,
    commentsNotifications,
    pendingMatchesNotifications,
    refetchNotifications: fetchNotifications,
    incrementNotification,
    setNotifications,
  };
};
