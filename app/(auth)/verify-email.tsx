import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const VerifyEmail = () => {
  const theme = useColorScheme() || "light";
  const isDark = theme === "dark";
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const email = params.email as string;
  const fullName = params.fullName as string;
  const university = params.university as string;

  const [verificationCode, setVerificationCode] = useState("");
  const demoCode = "887159"; // Demo code shown to user

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
      backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    codeDisplay: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
    },
  };

  const handleVerifyEmail = () => {
    if (verificationCode.length === 6) {
      router.push("/(auth)/signup-success");
    }
  };

  const handleResendCode = () => {
    console.log("Resending code...");
    // Demo: Just show a message or do nothing
  };

  const handleChangeEmail = () => {
    router.back();
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="fitness" size={32} color="#FFFFFF" />
          <Text style={[styles.appTitle, dynamicStyles.text]}>
            TarpAI Connect
          </Text>
          <Text style={[styles.tagline, dynamicStyles.subtitle]}>
            Smart campus connections powered by AI
          </Text>
        </View>

        {/* Email Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.emailIconCircle}>
            <Ionicons name="mail" size={48} color="#FFFFFF" />
          </View>
        </View>

        {/* Verify Email Section */}
        <View style={styles.verifySection}>
          <Text style={[styles.title, dynamicStyles.text]}>
            Verify Your Email
          </Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            We've sent a 6-digit code to
          </Text>
          <Text style={[styles.email, dynamicStyles.text]}>{email}</Text>

          {/* Demo Code Display */}
          <View style={[styles.codeDisplay, dynamicStyles.codeDisplay]}>
            <Text style={[styles.codeLabel, dynamicStyles.subtitle]}>
              Demo code for testing:
            </Text>
            <Text style={[styles.demoCode, dynamicStyles.text]}>
              {demoCode}
            </Text>
          </View>

          {/* Verification Code Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>
              Verification Code
            </Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder="Enter 6-digit code"
              placeholderTextColor={isDark ? "#666666" : "#999999"}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          {/* Verify Button */}
          <Pressable
            style={[
              styles.verifyButton,
              verificationCode.length !== 6 && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerifyEmail}
            disabled={verificationCode.length !== 6}
          >
            <Text style={styles.verifyButtonText}>Verify Email</Text>
          </Pressable>

          {/* Resend Code */}
          <Pressable style={styles.resendContainer} onPress={handleResendCode}>
            <Text style={[styles.resendText, dynamicStyles.text]}>
              Resend code
            </Text>
          </Pressable>

          {/* Change Email Address */}
          <Pressable style={styles.changeEmailContainer} onPress={handleChangeEmail}>
            <Text style={[styles.changeEmailText, dynamicStyles.subtitle]}>
              Change email address
            </Text>
          </Pressable>
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
  },
  tagline: {
    fontSize: 14,
    marginTop: 8,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  emailIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333333",
  },
  verifySection: {
    width: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  email: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
  codeDisplay: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  demoCode: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 18,
    letterSpacing: 8,
    textAlign: "center",
  },
  verifyButton: {
    backgroundColor: "#FFFFFF",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
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
    marginTop: 20,
  },
  resendText: {
    fontSize: 15,
    fontWeight: "600",
  },
  changeEmailContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  changeEmailText: {
    fontSize: 14,
  },
});

export default VerifyEmail;