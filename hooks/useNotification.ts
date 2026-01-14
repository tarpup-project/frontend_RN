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

export const useNotifications = (enablePolling = false) => {
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
    unreadCount,
    setNotifications,
    setNotificationsList,
    incrementNotification,
    markInitialized,
  } = useNotificationStore();

  const fetchNotifications = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const [response, tarpResponse] = await Promise.all([
        api.get<{
          status: string;
          data: NotificationResponse;
        }>(UrlConstants.allNotifications),
        api.get(UrlConstants.tarpNotifications)
      ]);

      let unread = 0;
      let notifList = [];
      if (tarpResponse.data?.status === 'success' && Array.isArray(tarpResponse.data?.data)) {
         notifList = tarpResponse.data.data;
         unread = notifList.filter((n: any) => !n.isRead).length;
      }

      if (response.data.status === "success") {
        setNotifications({
          groupNotifications: response.data.data.groupNotifications,
          personalNotifications: response.data.data.personalNotification,
          unreadCount: unread,
        });
        setNotificationsList(notifList);
        markInitialized();
      }
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error);
      
      // Don't reset notifications on rate limit errors
      if (error.response?.status !== 429) {
        setNotifications({
          groupNotifications: 0,
          personalNotifications: 0,
          chatNotifications: 0,
          unreadCount: 0,
        });
      }
    }
  };

  useEffect(() => {
    if (!enablePolling || !isAuthenticated || !user) return;

    // Initial fetch with delay to avoid immediate rate limiting
    // Increased delay to 5 seconds to reduce initial load and allow other components to fetch first
    const initialTimeout = setTimeout(async () => {
      fetchNotifications();
    }, 5000);

    // Enable automatic notification polling every 2 minutes (120 seconds)
    // Increased from 30s to avoid 429 Too Many Requests errors
    console.log('🔄 Starting automatic notification polling');
    const interval = setInterval(() => {
      console.log('📊 Fetching notifications automatically');
      fetchNotifications();
    }, 120000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isAuthenticated, user, enablePolling]);

  // Listen for app state changes to refresh notifications when app becomes active
  useEffect(() => {
    if (!enablePolling || !isAuthenticated || !user) return;

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
  }, [isAuthenticated, user, enablePolling]);

  return {
    groupNotifications,
    personalNotifications,
    chatNotifications,
    followerNotifications,
    friendPostsNotifications,
    postLikesNotifications,
    commentsNotifications,
    pendingMatchesNotifications,
    unreadCount,
    refetchNotifications: fetchNotifications,
    incrementNotification,
    setNotifications,
  };
};
