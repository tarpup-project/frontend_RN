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
  badgeType?: 'dot' | 'number';
}

const ProtectedTabIcon: React.FC<ProtectedTabIconProps> = ({
  name,
  size = 24,
  color,
  focused = false,
  isProtected,
  notificationCount = 0,
  badgeType = 'number'
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
        <View style={[
          styles.notificationBadge,
          dynamicStyles.notificationBadge,
          badgeType === 'dot' ? styles.dotBadge : styles.numberBadge
        ]}>
          {badgeType === 'number' && (
            <Text style={styles.notificationText}>
              {notificationCount > 99 ? "99+" : notificationCount.toString()}
            </Text>
          )}
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
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFFFFF"
  },
  dotBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    top: 0,
    right: 0
  },
  numberBadge: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8
  },
  notificationText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700"
  }
});

export default ProtectedTabIcon;