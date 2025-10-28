import { useTheme } from "@/app/contexts/ThemeContext";
import { Text } from "@/components/Themedtext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

const VerifyEmail = () => {
  const { isDark } = useTheme();
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
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    codeDisplay: {
      backgroundColor: isDark ? "#000000" : "#F5F5F5",
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
          <View style={styles.titleRow}>
            {/* TODO: Add your logo image here */}
            {/* <Image source={require('./path-to-logo.png')} style={styles.logo} /> */}
            <Text style={[styles.appTitle, dynamicStyles.text]}>
              TarpAI Connect
            </Text>
          </View>
          <Text style={[styles.tagline, dynamicStyles.subtitle]}>
            Join Your Campus Community
          </Text>
        </View>

        {/* Verify Email Section */}
        <View
          style={[styles.verifySection, styles.verifyBox, dynamicStyles.input]}
        >
          {/* Email Icon - Now Inside Box */}
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
          <Pressable
            style={styles.changeEmailContainer}
            onPress={handleChangeEmail}
          >
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
    paddingTop: 120,
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
  codeDisplay: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333333",
  },
  codeLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  demoCode: {
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 45,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    letterSpacing: 2,
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

export default VerifyEmail;
