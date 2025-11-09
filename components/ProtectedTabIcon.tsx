import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { useTheme } from "@/app/contexts/ThemeContext";

interface ProtectedTabIconProps {
  IconComponent: React.ComponentType<any>;
  size?: number;
  color: string;
  strokeWidth?: number;
  focused?: boolean;
  isProtected: boolean;
}

const ProtectedTabIcon: React.FC<ProtectedTabIconProps> = ({
  IconComponent,
  size = 20,
  color,
  strokeWidth = 2,
  focused = false,
  isProtected,
}) => {
  const { isDark } = useTheme();

  const dynamicStyles = {
    lockContainer: {
      backgroundColor: isDark ? '#1a1a1a' : '#FFFFFF',
      borderColor: isDark ? '#333333' : '#E0E0E0',
    },
    lockIcon: {
      color: isDark ? '#FF6B6B' : '#FF4444',
    },
  };

  return (
    <View style={styles.container}>
      <IconComponent 
        size={size} 
        color={color} 
        strokeWidth={focused ? 2.5 : strokeWidth}
      />
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
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default ProtectedTabIcon;