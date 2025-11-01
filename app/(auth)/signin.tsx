import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/app/contexts/ThemeContext";
import { useRouter } from "expo-router";
import { Text } from "@/components/Themedtext";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  View,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner-native";

const SignIn = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    input: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
      color: isDark ? "#FFFFFF" : "#000000",
    },
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = async () => {
    // Validation
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(email);
      console.log(" SENDING LOGIN REQUEST:", {
        email,
      });
      console.log("✅ LOGIN RESPONSE:", response);

      if (response.success) {
        toast.success("Verification code sent!", {
          description: "Check your email for the 6-digit code",
        });

        setTimeout(() => {
          router.push({
            pathname: "/(auth)/verify-signin",
            params: { email },
          });
        }, 1000);
      }
    } catch (error: any) {
      console.log("SIGNUP ERROR:", error);
      console.log(" ERROR RESPONSE:", error.response?.data);
      console.log(" ERROR STATUS:", error.response?.status);

      toast.error("Failed to send verification code", {
        description: error?.message || "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, dynamicStyles.container]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {/* <Image source={require('./path-to-logo.png')} style={styles.logo} /> */}
            <Text style={[styles.appTitle, dynamicStyles.text]}>
              TarpAI Connect
            </Text>
          </View>
          <Text style={[styles.tagline, dynamicStyles.subtitle]}>
            Smart campus connections powered by AI
          </Text>
        </View>

        <View
          style={[styles.signInSection, styles.signInBox, dynamicStyles.input]}
        >
          <Text style={[styles.title, dynamicStyles.text]}>Welcome back</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            Enter your email to sign in securely
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>
              University Email
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={dynamicStyles.subtitle.color}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, dynamicStyles.input]}
                placeholder="your.email@university.edu"
                placeholderTextColor={isDark ? "#666666" : "#999999"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
            <Text style={[styles.hint, dynamicStyles.subtitle]}>
              We'll send a verification code to confirm it's you
            </Text>
          </View>

          <Pressable
            style={[
              styles.continueButton,
              (!email || isLoading) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!email || isLoading}
          >
            {isLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator color="#000000" size="small" />
                <Text style={styles.continueButtonText}>
                  Sending verification code...
                </Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#000000" />
              </View>
            )}
          </Pressable>

          <View style={styles.securityNote}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#666666"
            />
            <Text style={[styles.securityText, dynamicStyles.subtitle]}>
              Your email is kept secure and never shared
            </Text>
          </View>

          <View style={styles.signUpContainer}>
            <Text style={[styles.signUpText, dynamicStyles.subtitle]}>
              Don't have an account?{" "}
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.signUpLink}>Sign up</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  tagline: {
    fontSize: 14,
    marginTop: 8,
  },
  signInSection: {
    width: "100%",
  },
  signInBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 15,
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
  },
  continueButton: {
    backgroundColor: "#FFFFFF",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  loaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  continueButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  securityText: {
    fontSize: 12,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default SignIn;