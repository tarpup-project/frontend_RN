import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/state/authStore";
import { saveUserData } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import { subscribeToTopic } from '@/hooks/usePushNotifications';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { toast } from "sonner-native";

const VerifySignIn = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { verifyOTP, resendOTP } = useAuth();

  const email = params.email as string;
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

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
    input: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    digitBox: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },

    verifyButton: {
      backgroundColor: code.join("").length === 6 
        ? (isDark ? "#FFFFFF" : "#000000")
        : "#828282",
    },
    verifyButtonText: {
      color: code.join("").length === 6 
        ? (isDark ? "#000000" : "#FFFFFF")
        : "#FFFFFF",
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
      const response = await verifyOTP(email, verificationCode);
      console.log('✅ Verify response:', response);
      if (response.success && response.user) {
        try {
          await subscribeToTopic('all_users');
          await subscribeToTopic('announcements');
          
          if (response.user.universityID) {
            await subscribeToTopic(`university_${response.user.universityID}`);
          }
        } catch (error) {
          console.error('Failed to subscribe to topics:', error);
        }
  
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
      const response = await resendOTP(email, 'signin');

      if (response.success) {
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
    <View style={[styles.container, dynamicStyles.container]}>
      <KeyboardAwareScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={50}
        enableAutomaticScroll={true}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.logoSpace}>
              <Image
                source={
                  isDark
                    ? require("@/assets/images/tarpup-plain-dark.png")
                    : require("@/assets/images/tarpup-plain.png")
                }
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.appTitle, dynamicStyles.text]}>
              TarpAI Connect
            </Text>
          </View>
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
              {code.slice(0, 3).map((digit, index) => (
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

              <Text style={[styles.hyphen, dynamicStyles.text]}>—</Text>

              {code.slice(3, 6).map((digit, index) => (
                <TextInput
                  key={index + 3}
                  ref={(ref) => {
                    inputRefs.current[index + 3] = ref;
                  }}
                  style={[
                    styles.digitBox,
                    dynamicStyles.digitBox,
                    dynamicStyles.text,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index + 3)}
                  onKeyPress={(e) => handleKeyPress(e, index + 3)}
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
                dynamicStyles.verifyButton,
                code.join("").length !== 6 && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerifySignIn}
              disabled={code.join("").length !== 6}
            >
              <Text
                style={[
                  styles.verifyButtonText,
                  dynamicStyles.verifyButtonText,
                ]}
              >
                Verify Email
              </Text>
            </Pressable>
          ) : (
            <View style={[styles.verifyButton, dynamicStyles.verifyButton]}>
              <ActivityIndicator
                color={dynamicStyles.verifyButtonText.color}
                size="small"
              />
              <Text
                style={[
                  styles.verifyButtonText,
                  dynamicStyles.verifyButtonText,
                ]}
              >
                {" "}
                Verifying...
              </Text>
            </View>
          )}
          <Text style={[styles.spam, dynamicStyles.subtitle]}>
            Didn't Receive it? Please check your spam or junk folder.
          </Text>

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
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 180,
    minHeight: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoSpace: {
    width: 35,
    height: 35,
  },
  appTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  tagline: {
    fontSize: 12,
    marginTop: 8,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 5,
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
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  logo: {
    width: 35,
    height: 35,
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  email: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  digitContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  digitBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    textAlignVertical: "center",
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
  },
  verifyButton: {
    height: 35,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  hyphen: {
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 4,
  },
  verifyButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  resendText: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 10,
  },
  changeEmailContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  changeEmailText: {
    fontSize: 12,
    marginBottom: 5,
    fontWeight: "700",
  },
  spam: {
    fontSize: 9,
    textAlign: "center",
    marginTop: 10,
  },
});

export default VerifySignIn;
