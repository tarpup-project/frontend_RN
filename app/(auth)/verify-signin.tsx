import { useTheme } from "@/app/contexts/ThemeContext";
import { Text } from "@/components/Themedtext";
import { UrlConstants } from "@/constants/apiUrls";
import { useAuthStore } from "@/state/authStore";
import { saveTokens, saveUserData } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { toast } from "sonner-native";

const VerifySignIn = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const email = params.email as string;
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

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
    digitBox: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text[text.length - 1];
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifySignIn = async () => {
    const verificationCode = code.join("");
    if (verificationCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await axios.post(`${UrlConstants.baseUrl}/user/verify`, {
        email: email,
        token: verificationCode,
      });

      if (response.data.status === "success") {
        const userData = response.data.data;
        await saveUserData(userData);
        useAuthStore.getState().setUser(userData);
      
        toast.success("Welcome back!", {
          description: "You've been signed in successfully",
        });
      
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 800);
      }


    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Invalid code. Please try again.";

      toast.error("Verification failed", {
        description: errorMessage,
      });
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      const response = await axios.post(
        `${UrlConstants.baseUrl}/user/resend-otp`,
        {
          email: email,
          mode: "signin",
        }
      );
      console.log(email, response);

      if (response.data.status === "success") {
        toast.success("Code resent!", {
          description: "Check your email for the new code",
        });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Please try again";

      toast.error("Failed to resend code", {
        description: errorMessage,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, dynamicStyles.container]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.appTitle, dynamicStyles.text]}>
            TarpAI Connect
          </Text>
          <Text style={[styles.tagline, dynamicStyles.subtitle]}>
            Smart campus connections powered by AI
          </Text>
        </View>

        <View
          style={[styles.verifySection, styles.verifyBox, dynamicStyles.input]}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name="mail-outline"
              size={48}
              color={dynamicStyles.text.color}
            />
          </View>

          <Text style={[styles.title, dynamicStyles.text]}>
            Verify Your Email
          </Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            We've sent a 6-digit code to
          </Text>
          <Text style={[styles.email, dynamicStyles.text]}>{email}</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>
              Verification Code
            </Text>
            <View style={styles.digitContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.digitBox,
                    dynamicStyles.digitBox,
                    dynamicStyles.text,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!isVerifying}
                  selectTextOnFocus
                />
              ))}
            </View>
          </View>

          {!isVerifying ? (
            <Pressable
              style={[
                styles.verifyButton,
                code.join("").length !== 6 && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerifySignIn}
              disabled={code.join("").length !== 6}
            >
              <Text style={styles.verifyButtonText}>Verify Email</Text>
            </Pressable>
          ) : (
            <View style={styles.verifyButton}>
              <ActivityIndicator color="#000000" size="small" />
              <Text style={styles.verifyButtonText}> Verifying...</Text>
            </View>
          )}

          <Pressable
            style={styles.resendContainer}
            onPress={handleResendCode}
            disabled={isResending || isVerifying}
          >
            <Text
              style={[
                styles.resendText,
                dynamicStyles.text,
                (isResending || isVerifying) && { opacity: 0.5 },
              ]}
            >
              {isResending ? "Sending..." : "Resend Code"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.changeEmailContainer}
            onPress={handleChangeEmail}
            disabled={isVerifying}
          >
            <Text style={[styles.changeEmailText, dynamicStyles.subtitle]}>
              Change email address
            </Text>
          </Pressable>
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
    paddingTop: 120,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  tagline: {
    fontSize: 14,
    marginTop: 8,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  verifySection: {
    width: "100%",
  },
  verifyBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  digitContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  digitBox: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  verifyButton: {
    backgroundColor: "#FFFFFF",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  resendText: {
    fontSize: 15,
    fontWeight: "600",
  },
  changeEmailContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  changeEmailText: {
    fontSize: 14,
  },
});

export default VerifySignIn;
