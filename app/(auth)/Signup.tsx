
import { useTheme } from "@/app/contexts/ThemeContext";
import { Text } from "@/components/Themedtext";
import { UrlConstants } from "@/constants/apiUrls";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { toast } from "sonner-native";

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
  const [isAdult, setIsAdult] = useState(false);
  const [acceptsResponsibility, setAcceptsResponsibility] = useState(false);

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
      color: isDark ? "#FFFFFF" : "#000000",
    },
    sendButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    sendButtonText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
    checkbox: {
      borderColor: isDark ? "#333333" : "#E0E0E0",
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    checkedBox: {
      backgroundColor: "#00D084",
      borderColor: "#00D084",
    },
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

    if (!isAdult) {
      toast.error("You must be 18 or above to create an account");
      return;
    }

    if (!acceptsResponsibility) {
      toast.error("Please accept responsibility for your safety");
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
  <KeyboardAwareScrollView
    style={styles.content}
    contentContainerStyle={styles.contentContainer}
    keyboardShouldPersistTaps="handled"
    enableOnAndroid={true}
    extraScrollHeight={20}
    enableAutomaticScroll={true}
    showsVerticalScrollIndicator={false}
  >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
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
              placeholder="Enter your fullname"
              placeholderTextColor={isDark ? "#666666" : "#999999"}
              value={fullName}
              onChangeText={setFullName}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>School Email</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder="name@school.edu"
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
                <ActivityIndicator
                  size="small"
                  color={dynamicStyles.text.color}
                />
              ) : (
                <Ionicons
                  name={showUniversityDropdown ? "chevron-up" : "chevron-down"}
                  size={12}
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
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {universities.map((uni) => (
                    <Pressable
                      key={uni.id}
                      style={[
                        styles.dropdownItem,
                        {
                          borderBottomColor: dynamicStyles.dropdown.borderColor,
                        },
                      ]}
                      onPress={() => {
                        setUniversity(uni.name);
                        setUniversityID(uni.id);
                        setShowUniversityDropdown(false);
                      }}
                    >
                      <View style={styles.dropdownItemContent}>
                        <Text
                          style={[styles.dropdownItemText, dynamicStyles.text]}
                        >
                          {uni.name}
                        </Text>
                        <Text
                          style={[
                            styles.dropdownItemSubtext,
                            dynamicStyles.subtitle,
                          ]}
                        >
                          {uni.city}, {uni.state}
                        </Text>
                      </View>
                      {university === uni.name && (
                        <Ionicons name="checkmark" size={12} color="#00D084" />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Checkboxes */}
          <View style={styles.checkboxContainer}>
            <Pressable
              style={[styles.checkboxRow]}
              onPress={() => setIsAdult(!isAdult)}
            >
              <View
                style={[
                  styles.checkbox,
                  dynamicStyles.checkbox,
                  isAdult && dynamicStyles.checkedBox,
                ]}
              >
                {isAdult && (
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                )}
              </View>
              <Text style={[styles.checkboxText, dynamicStyles.text]}>
                I am 18 or above
              </Text>
            </Pressable>

            <Pressable
              style={[styles.checkboxRow]}
              onPress={() => setAcceptsResponsibility(!acceptsResponsibility)}
            >
              <View
                style={[
                  styles.checkbox,
                  dynamicStyles.checkbox,
                  acceptsResponsibility && dynamicStyles.checkedBox,
                ]}
              >
                {acceptsResponsibility && (
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                )}
              </View>
              <Text style={[styles.checkboxText, dynamicStyles.text]}>
                I accept responsibility for my safety when meeting or chatting
                with others.
              </Text>
            </Pressable>
          </View>

          {!isLoading ? (
            <Pressable
              style={[
                styles.sendButton,
                dynamicStyles.sendButton,
                (!fullName ||
                  !email ||
                  !university ||
                  !isAdult ||
                  !acceptsResponsibility ||
                  isLoadingUniversities) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSendVerification}
              disabled={
                !fullName ||
                !email ||
                !university ||
                !isAdult ||
                !acceptsResponsibility ||
                isLoadingUniversities
              }
            >
              <Text
                style={[styles.sendButtonText, dynamicStyles.sendButtonText]}
              >
                Send Verification Code
              </Text>
            </Pressable>
          ) : (
            <View style={[styles.sendButton, dynamicStyles.sendButton]}>
              <ActivityIndicator
                color={isDark ? "#000000" : "#FFFFFF"}
                size="small"
              />
              <Text
                style={[styles.sendButtonText, dynamicStyles.sendButtonText]}
              >
                {" "}
                Sending...
              </Text>
            </View>
          )}

          <View style={styles.signInContainer}>
            <Text style={[styles.signInText, dynamicStyles.subtitle]}>
              Already have an account?{" "}
            </Text>
            <Pressable onPress={() => router.push("/(auth)/signin")}>
              <Text style={[styles.signInLink, dynamicStyles.signInLink]}>
                Sign in
              </Text>
            </Pressable>
          </View>
        </View>
        </KeyboardAwareScrollView>
        </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 40,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 30,
    height: 30,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  tagline: {
    fontSize: 10,
    marginTop: 8,
  },
  formSection: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 11,
    marginBottom: 12,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 12,
  },
  dropdown: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownAbsolute: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  dropdownText: {
    fontSize: 9,
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    maxHeight: 200, // Reduced from 300
  },
  dropdownScroll: {
    maxHeight: 200, // Reduced from 300
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12, // Reduced from 14
    borderBottomWidth: 1,
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 12,
    fontWeight: "500",
  },
  dropdownItemSubtext: {
    fontSize: 7,
    marginTop: 2,
  },
  checkboxContainer: {
    marginBottom: 16,
    gap: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  checkboxText: {
    fontSize: 10,
    flex: 1,
    lineHeight: 16,
    fontWeight: "700",
  },
  sendButton: {
    height: 35,
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
    fontSize: 11,
    fontWeight: "700",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  signInText: {
    fontSize: 11, 
    fontWeight: "700",
  },
  signInLink: {
    fontSize: 11, 
    fontWeight: "700",
  },
});

export default Signup;