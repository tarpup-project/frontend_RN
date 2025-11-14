import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

interface LoaderProps {
  size?: "small" | "large";
  color?: string;
  text?: string;
  textStyle?: any;
  style?: any;
}

export const Loader: React.FC<LoaderProps> = ({
  size = "small",
  color,
  text,
  textStyle,
  style,
}) => {
  const { isDark } = useTheme();

  const loaderColor = color || (isDark ? "#FFFFFF" : "#000000");

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={loaderColor} />
      {text && <Text style={[styles.text, textStyle]}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    marginLeft: 8,
    fontSize: 12,
  },
});
