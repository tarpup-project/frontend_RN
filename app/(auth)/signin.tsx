import { useTheme } from "@/app/contexts/ThemeContext";
import { Text } from "@/components/Themedtext";
import { UrlConstants } from "@/constants/apiUrls";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { toast } from "sonner-native";

const SignIn = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    input: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    continueButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    continueButtonText: {
      color: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    signUpLink: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = async () => {
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
      const response = await axios.post(`${UrlConstants.baseUrl}/user/login`, {
        email: email,
      });

      if (response.data.status === "success") {
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
      const errorMessage = error?.response?.data?.message || "Please try again";

      toast.error("Failed to send verification code", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, dynamicStyles.container]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Image
                source={
                  isDark
                    ? require("@/assets/images/tarpup-plain-dark.png")
                    : require("@/assets/images/tarpup-plain.png")
                }
                style={styles.logo}
                resizeMode="contain"
              />
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
            <Text style={[styles.title, dynamicStyles.text]}>Welcome Back</Text>
            <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
              Enter your email to sign in securely
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, dynamicStyles.text]}>
                University Email
              </Text>
              <TextInput
                style={[styles.input, dynamicStyles.input]}
                placeholder="your.email@university.edu"
                placeholderTextColor={isDark ? "#666666" : "#999999"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                autoCorrect={false}
                autoComplete="email"
              />
              <Text style={[styles.hint, dynamicStyles.subtitle]}>
                We will send a verification code to confirm it is you
              </Text>
            </View>

            {!isLoading ? (
              <Pressable
                style={[
                  styles.continueButton,
                  dynamicStyles.continueButton,
                  !email && styles.continueButtonDisabled,
                ]}
                onPress={handleContinue}
                disabled={!email}
              >
                <Text
                  style={[
                    styles.continueButtonText,
                    dynamicStyles.continueButtonText,
                  ]}
                >
                  Continue
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={dynamicStyles.continueButtonText.color}
                />
              </Pressable>
            ) : (
              <View style={[styles.continueButton, dynamicStyles.continueButton]}>
                <ActivityIndicator
                  color={dynamicStyles.continueButtonText.color}
                  size="small"
                />
                <Text
                  style={[
                    styles.continueButtonText,
                    dynamicStyles.continueButtonText,
                  ]}
                >
                  {" "}
                  Sending...
                </Text>
              </View>
            )}

            <View style={styles.securityNote}>
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={isDark ? "#4A90E2" : "#5B9BD5"}
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
                <Text style={[styles.signUpLink, dynamicStyles.signUpLink]}>
                  Sign Up
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 200,
    paddingBottom: 40,
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
    width: 24,
    height: 24,
  },
  appTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  tagline: {
    fontSize: 12,
    fontWeight: "700",
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
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  continueButton: {
    height: 35,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    borderRadius: 6,
  },
  securityText: {
    fontSize: 10,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  signUpText: {
    fontSize: 12,
  },
  signUpLink: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default SignIn;