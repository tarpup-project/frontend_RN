import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/app/contexts/ThemeContext";
import { useState } from "react";
import { Text } from "@/components/Themedtext";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const Signup = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);

  const universities = [
    "University of Florida",
    "University of South Florida",
    "Florida State University",
    "University of Miami",
    "University of Central Florida",
    "Florida International University",
  ];

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
      dropdown: {
        backgroundColor: isDark ? "#000000" : "#FFFFFF",
        borderColor: isDark ? "#333333" : "#E0E0E0",
      },
  };

  const handleSendVerification = () => {
    if (fullName && email && university) {
      router.push({
        pathname: "/(auth)/verify-email",
        params: { email, fullName, university },
      });
    }
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* <Image source={require('./path-to-logo.png')} style={styles.logo} /> */}
          <Text style={[styles.appTitle, dynamicStyles.text]}>
            TarpAI Connect
          </Text>
          <Text style={[styles.tagline, dynamicStyles.subtitle]}>
            Join your campus community
          </Text>
        </View>

        {/* Form Section */}
        <View style={[styles.formSection, dynamicStyles.dropdown]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Create Account
          </Text>
          <Text style={[styles.sectionSubtitle, dynamicStyles.subtitle]}>
            Connect with students at your university
          </Text>

          {/* Full Name Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>Full Name</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder="John Doe"
              placeholderTextColor={isDark ? "#666666" : "#999999"}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* University Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>
              University Email
            </Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder="johndoe@gmail.com"
              placeholderTextColor={isDark ? "#666666" : "#999999"}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* University Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>University</Text>
            <Pressable
              style={[styles.dropdown, dynamicStyles.dropdown]}
              onPress={() => setShowUniversityDropdown(!showUniversityDropdown)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  university ? dynamicStyles.text : dynamicStyles.subtitle,
                ]}
              >
                {university || "Select your university"}
              </Text>
              <Ionicons
                name={showUniversityDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color={dynamicStyles.text.color}
              />
            </Pressable>

            {/* Dropdown Options */}
            {showUniversityDropdown && (
  <View style={[styles.dropdownList, dynamicStyles.dropdown, styles.dropdownAbsolute]}>
                {universities.map((uni, index) => (
                  <Pressable
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setUniversity(uni);
                      setShowUniversityDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, dynamicStyles.text]}>
                      {uni}
                    </Text>
                    {university === uni && (
                      <Ionicons name="checkmark" size={20} color="#00D084" />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Send Verification Button */}
          <Pressable
            style={[
              styles.sendButton,
              (!fullName || !email || !university) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendVerification}
            disabled={!fullName || !email || !university}
          >
            <Text style={styles.sendButtonText}>Send Verification Code</Text>
          </Pressable>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={[styles.signInText, dynamicStyles.subtitle]}>
              Already have an account?{" "}
            </Text>
            <Pressable onPress={() => router.push("/(auth)/signin")}>
              <Text style={styles.signInLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 40,
    height: 40,
    marginBottom: 12,
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
  formSection: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 32,
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
  input: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  dropdown: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownAbsolute: {
    position: "absolute",
    top: 58,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  dropdownText: {
    fontSize: 15,
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  dropdownItemText: {
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: "#FFFFFF",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  signInText: {
    fontSize: 14,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default Signup;
