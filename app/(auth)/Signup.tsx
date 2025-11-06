import { useTheme } from "@/app/contexts/ThemeContext";
import { Text } from "@/components/Themedtext";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { toast } from "sonner-native";
import axios from "axios";
import { UrlConstants } from "@/constants/apiUrls";

interface University {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
}

interface UniversityGroup {
  country: string;
  state: string;
  universities: University[];
}


const Signup = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const { signup } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [universityID, setUniversityID] = useState("");
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(true);

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
    dropdown: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    signInLink: {
      color: isDark ? "#FFFFFF" : "#000000"
    },
    sendButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000"
    },
    sendButtonText: {
      color: isDark ? "#000000" : "#FFFFFF"
    }
  };

  const fetchUniversities = async () => {
    try {
      setIsLoadingUniversities(true);
  
      const response = await axios.get<{
        status: string;
        data: UniversityGroup[];
      }>(`${UrlConstants.baseUrl}${UrlConstants.fetchAllUniversities}`);
  
      const allUniversities: University[] = response.data.data.flatMap(
        (group) => group.universities
      );
  
      setUniversities(allUniversities);
    } catch (error: any) {
      toast.error("Failed to load universities", {
        description: "Please try again",
      });
      setUniversities([]);
    } finally {
      setIsLoadingUniversities(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendVerification = async () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!universityID) {
      toast.error("Please select your university");
      return;
    }

    setIsLoading(true);
    try {
      const response = await signup({
        email,
        fullName,
        universityID,
      });

      if (response.success) {
        toast.success("Verification code sent!", {
          description: "Check your email for the 6-digit code",
        });

        setTimeout(() => {
          router.push({
            pathname: "/(auth)/verify-email",
            params: { email, fullName, university },
          });
        }, 1000);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.message || "Please try again";

      toast.error("Failed to send verification code", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={[styles.appTitle, dynamicStyles.text]}>
            TarpAI Connect
          </Text>
          <Text style={[styles.tagline, dynamicStyles.subtitle]}>
            Join your campus community
          </Text>
        </View>

        <View style={[styles.formSection, dynamicStyles.dropdown]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Create Account
          </Text>
          <Text style={[styles.sectionSubtitle, dynamicStyles.subtitle]}>
            Connect with students at your university
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>Full Name</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder="John Doe"
              placeholderTextColor={isDark ? "#666666" : "#999999"}
              value={fullName}
              onChangeText={setFullName}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>
              University Email
            </Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder="johndoe@university.edu"
              placeholderTextColor={isDark ? "#666666" : "#999999"}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>University</Text>
            <Pressable
              style={[styles.dropdown, dynamicStyles.dropdown]}
              onPress={() => {
                if (!isLoading && !isLoadingUniversities) {
                  setShowUniversityDropdown(!showUniversityDropdown);
                }
              }}
              disabled={isLoading || isLoadingUniversities}
            >
              <Text
                style={[
                  styles.dropdownText,
                  university ? dynamicStyles.text : dynamicStyles.subtitle,
                ]}
              >
                {isLoadingUniversities
                  ? "Loading universities..."
                  : university || "Select your university"}
              </Text>
              {isLoadingUniversities ? (
                <ActivityIndicator size="small" color={dynamicStyles.text.color} />
              ) : (
                <Ionicons
                  name={showUniversityDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={dynamicStyles.text.color}
                />
              )}
            </Pressable>

            {showUniversityDropdown && (
  <View
    style={[
      styles.dropdownList,
      dynamicStyles.dropdown,
      styles.dropdownAbsolute,
    ]}
  >
    <ScrollView
      style={styles.dropdownScroll}
      showsVerticalScrollIndicator={true} // Show scroll indicator
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled" // Better UX for dropdown
    >
      {universities.map((uni) => (
        <Pressable
          key={uni.id}
          style={[
            styles.dropdownItem,
            { borderBottomColor: dynamicStyles.dropdown.borderColor }
          ]}
          onPress={() => {
            setUniversity(uni.name);
            setUniversityID(uni.id);
            setShowUniversityDropdown(false);
          }}
        >
          <View style={styles.dropdownItemContent}>
            <Text style={[styles.dropdownItemText, dynamicStyles.text]}>
              {uni.name}
            </Text>
            <Text style={[styles.dropdownItemSubtext, dynamicStyles.subtitle]}>
              {uni.city}, {uni.state}
            </Text>
          </View>
          {university === uni.name && (
            <Ionicons name="checkmark" size={20} color="#00D084" />
          )}
        </Pressable>
      ))}
    </ScrollView>
  </View>
)}
          </View>

          {!isLoading ? (
            <Pressable
            style={[
              styles.sendButton,
              dynamicStyles.sendButton,
              (!fullName || !email || !university || isLoadingUniversities) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSendVerification}
            disabled={!fullName || !email || !university || isLoadingUniversities}
          >
            <Text style={[styles.sendButtonText, dynamicStyles.sendButtonText]}>
              Send Verification Code
            </Text>
          </Pressable>
          ) : (
            <View style={[styles.sendButton, dynamicStyles.sendButton]}>
              <ActivityIndicator color={isDark ? "#000000" : "#FFFFFF"} size="small" />
              <Text style={[styles.sendButtonText, dynamicStyles.sendButtonText]}>
                {" "}Sending...
              </Text>
            </View>        
          )}

          <View style={styles.signInContainer}>
            <Text style={[styles.signInText, dynamicStyles.subtitle]}>
              Already have an account?{" "}
            </Text>
            <Pressable onPress={() => router.push("/(auth)/signin")}>
              <Text style={[styles.signInLink, dynamicStyles.signInLink]}>Sign in</Text>
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
    fontSize: 18,
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
    fontSize: 18,
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
  maxHeight: 300, 
},
dropdownScroll: {
  maxHeight: 300, 
},
dropdownItem: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingVertical: 14, 
  borderBottomWidth: 1,
},
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
  dropdownItemSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  sendButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
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

  },
});

export default Signup;