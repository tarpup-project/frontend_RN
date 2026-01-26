import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSocketConnection } from "@/hooks/useSocketConnection";
import { useNetworkStore } from "@/state/networkStore";
import { StyleSheet, View } from "react-native";

export const NetworkStatusBanner = () => {
  const { isNetworkConnected, isSocketConnected, isOnline, isReconnecting } = useSocketConnection();
  const { isApiConnectionError, apiErrorMessage } = useNetworkStore();
  const { isDark } = useTheme();

  // Don't show banner if everything is working and no API error
  if (isOnline && !isApiConnectionError) return null;

  const getStatusMessage = () => {
    if (isApiConnectionError) {
      return apiErrorMessage || "Bad network connection";
    }
    if (!isNetworkConnected) {
      return "No internet connection";
    }
    if (isReconnecting) {
      return "Reconnecting to chat...";
    }
    if (!isSocketConnected) {
      return "Connecting to chat...";
    }
    return "Connection issues";
  };

  const getStatusColor = () => {
    // Red for critical errors (no net or api failure)
    if (!isNetworkConnected || isApiConnectionError) {
      return "#FF3B30";
    }
    if (isReconnecting) {
      return "#FF9500"; // Orange for reconnecting
    }
    return "#FF9500"; // Orange for socket issues
  };

  return (
    <View style={[styles.banner, { backgroundColor: getStatusColor() }]}>
      <Text style={styles.bannerText}>
        {getStatusMessage()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});