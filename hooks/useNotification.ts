import { UrlConstants } from "@/constants/apiUrls";
import { useAuthStore } from "@/state/authStore";
import { useNotificationStore } from "@/state/notificationStore";
import axios from "axios";
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
  } = useNotificationStore();

  const fetchNotifications = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await axios.get<{
        status: string;
        data: NotificationResponse;
      }>(`${UrlConstants.baseUrl}${UrlConstants.allNotifications}`);

      if (response.data.status === "success") {
        setNotifications({
          groupNotifications: response.data.data.groupNotifications,
          personalNotifications: response.data.data.personalNotification,
        });
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications({
        groupNotifications: 0,
        personalNotifications: 0,
        chatNotifications: 0,
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
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

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  return {
    groupNotifications,
    personalNotifications,
    chatNotifications,
    refetchNotifications: fetchNotifications,
  };
};
