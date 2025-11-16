import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

const SignupSuccess = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark" size={64} color="#00D084" />
          </View>
        </View>

        {/* Success Message */}
        <Text style={[styles.title, dynamicStyles.text]}>Email verified</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
          User account created
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#00D08420",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#00D084",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
});

export default SignupSuccess;
