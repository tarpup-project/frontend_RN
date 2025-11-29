import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ProtectedTabIconProps {
  name: string; 
  size?: number;
  color: string;
  focused?: boolean;
  isProtected: boolean;
  notificationCount?: number;
}

const ProtectedTabIcon: React.FC<ProtectedTabIconProps> = ({
  name, 
  size = 24,
  color,
  focused = false,
  isProtected,
  notificationCount = 0
}) => {
  const { isDark } = useTheme();

  const dynamicStyles = {
    lockContainer: {
      backgroundColor: isDark ? "#1a1a1a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0"
    },
    lockIcon: {
      color: isDark ? "#FF6B6B" : "#FF4444"
    },
    notificationBadge: {
      backgroundColor: "#FF3B30"
    }
  };

  return (
    <>
      <Ionicons name={name as any} size={size} color={color} /> 

      {notificationCount > 0 && !isProtected && (
        <View style={[styles.notificationBadge, dynamicStyles.notificationBadge]}>
          <Text style={styles.notificationText}>
            {notificationCount > 99 ? "99+" : notificationCount.toString()}
          </Text>
        </View>
      )}

      {isProtected && (
        <View style={[styles.lockContainer, dynamicStyles.lockContainer]}>
          <Ionicons name="lock-closed" size={10} color={dynamicStyles.lockIcon.color} />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  lockContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  notificationText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700"
  }
});

export default ProtectedTabIcon;