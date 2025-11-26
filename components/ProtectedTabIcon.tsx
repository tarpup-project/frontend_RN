import { useTheme } from "@/contexts/ThemeContext";
import { Lock } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";

interface ProtectedTabIconProps {
  IconComponent: React.ComponentType<any>;
  size?: number;
  color: string;
  strokeWidth?: number;
  focused?: boolean;
  isProtected: boolean;
  notificationCount?: number;
}

const ProtectedTabIcon: React.FC<ProtectedTabIconProps> = ({
  IconComponent,
  size = 20,
  color,
  strokeWidth = 2,
  focused = false,
  isProtected,
  notificationCount = 0,
}) => {
  const { isDark } = useTheme();

  const dynamicStyles = {
    lockContainer: {
      backgroundColor: isDark ? "#1a1a1a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    lockIcon: {
      color: isDark ? "#FF6B6B" : "#FF4444",
    },
    notificationBadge: {
      backgroundColor: "#FF3B30",
    },
  };

  return (
    <View style={styles.container}>
      <IconComponent
        size={size}
        color={color}
        strokeWidth={focused ? 2.5 : strokeWidth}
      />

      {notificationCount > 0 && !isProtected && (
        <View
          style={[styles.notificationBadge, dynamicStyles.notificationBadge]}
        >
          <Text style={styles.notificationText}>
            {notificationCount > 99 ? "99+" : notificationCount.toString()}
          </Text>
        </View>
      )}

      {isProtected && (
        <View style={[styles.lockContainer, dynamicStyles.lockContainer]}>
          <Lock
            size={10}
            color={dynamicStyles.lockIcon.color}
            strokeWidth={2.5}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 44,  
    height: 44
   // padding: 12,
  },
  lockContainer: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  notificationBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  notificationText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default ProtectedTabIcon;
