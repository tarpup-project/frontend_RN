// import { useTheme } from "@/app/contexts/ThemeContext";
// import { Text } from "@/components/Themedtext";
// import { useAuth } from "@/hooks/useAuth";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { useState } from "react";
// import {
//   ActivityIndicator,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   TextInput,
//   View,
// } from "react-native";
// import { toast } from "sonner-native";

// const Signup = () => {
//   const { isDark } = useTheme();
//   const router = useRouter();
//   const { signup } = useAuth();

//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [university, setUniversity] = useState("");
//   const [universityID, setUniversityID] = useState("");
//   const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   // Static universities list (will be replaced with API later)
//   const universities = [
//     { id: "univ_001", name: "University of Florida" },
//     { id: "univ_002", name: "Florida State University" },
//   ];

//   const dynamicStyles = {
//     container: {
//       backgroundColor: isDark ? "#000000" : "#FFFFFF",
//     },
//     text: {
//       color: isDark ? "#FFFFFF" : "#000000",
//     },
//     subtitle: {
//       color: isDark ? "#CCCCCC" : "#666666",
//     },
//     input: {
//       backgroundColor: isDark ? "#000000" : "#FFFFFF",
//       borderColor: isDark ? "#333333" : "#E0E0E0",
//       color: isDark ? "#FFFFFF" : "#000000",
//     },
//     dropdown: {
//       backgroundColor: isDark ? "#000000" : "#FFFFFF",
//       borderColor: isDark ? "#333333" : "#E0E0E0",
//     },
//   };

//   const validateEmail = (email: string): boolean => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
//   };

//   const handleSendVerification = async () => {
//     if (!fullName.trim()) {
//       toast.error("Please enter your full name");
//       return;
//     }

//     if (!email) {
//       toast.error("Please enter your email address");
//       return;
//     }

//     if (!validateEmail(email)) {
//       toast.error("Please enter a valid email address");
//       return;
//     }

//     if (!universityID) {
//       toast.error("Please select your university");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       console.log(" SENDING SIGNUP REQUEST:", {
//         email,
//         fullName,
//         universityID,
//       });
//       const response = await signup({
//         email,
//         fullName,
//         universityID,
//       });
//       console.log("✅ SIGNUP RESPONSE:", response);

//       if (response.success) {
//         toast.success("Verification code sent!", {
//           description: "Check your email for the 6-digit code",
//         });

//         setTimeout(() => {
//           router.push({
//             pathname: "/(auth)/verify-email",
//             params: { email, fullName, university },
//           });
//         }, 1000);
//       }
//     } catch (error: any) {
//       console.log("SIGNUP ERROR:", error);
//       console.log(" ERROR RESPONSE:", error.response?.data);
//       console.log(" ERROR STATUS:", error.response?.status);

//       toast.error("Failed to send verification code", {
//         description: error?.message || "Please try again",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <View style={[styles.container, dynamicStyles.container]}>
//       <ScrollView
//         style={styles.content}
//         contentContainerStyle={styles.contentContainer}
//       >
//         {/* Header */}
//         <View style={styles.header}>
//           {/* <Image source={require('./path-to-logo.png')} style={styles.logo} /> */}
//           <Text style={[styles.appTitle, dynamicStyles.text]}>
//             TarpAI Connect
//           </Text>
//           <Text style={[styles.tagline, dynamicStyles.subtitle]}>
//             Join your campus community
//           </Text>
//         </View>

//         {/* Form Section */}
//         <View style={[styles.formSection, dynamicStyles.dropdown]}>
//           <Text style={[styles.sectionTitle, dynamicStyles.text]}>
//             Create Account
//           </Text>
//           <Text style={[styles.sectionSubtitle, dynamicStyles.subtitle]}>
//             Connect with students at your university
//           </Text>

//           {/* Full Name Input */}
//           <View style={styles.inputGroup}>
//             <Text style={[styles.label, dynamicStyles.text]}>Full Name</Text>
//             <TextInput
//               style={[styles.input, dynamicStyles.input]}
//               placeholder="John Doe"
//               placeholderTextColor={isDark ? "#666666" : "#999999"}
//               value={fullName}
//               onChangeText={setFullName}
//               editable={!isLoading}
//             />
//           </View>

//           {/* University Email Input */}
//           <View style={styles.inputGroup}>
//             <Text style={[styles.label, dynamicStyles.text]}>
//               University Email
//             </Text>
//             <TextInput
//               style={[styles.input, dynamicStyles.input]}
//               placeholder="johndoe@university.edu"
//               placeholderTextColor={isDark ? "#666666" : "#999999"}
//               value={email}
//               onChangeText={setEmail}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               editable={!isLoading}
//             />
//           </View>

//           {/* University Dropdown */}
//           <View style={styles.inputGroup}>
//             <Text style={[styles.label, dynamicStyles.text]}>University</Text>
//             <Pressable
//               style={[styles.dropdown, dynamicStyles.dropdown]}
//               onPress={() => {
//                 if (!isLoading) {
//                   setShowUniversityDropdown(!showUniversityDropdown);
//                 }
//               }}
//               disabled={isLoading}
//             >
//               <Text
//                 style={[
//                   styles.dropdownText,
//                   university ? dynamicStyles.text : dynamicStyles.subtitle,
//                 ]}
//               >
//                 {university || "Select your university"}
//               </Text>
//               <Ionicons
//                 name={showUniversityDropdown ? "chevron-up" : "chevron-down"}
//                 size={20}
//                 color={dynamicStyles.text.color}
//               />
//             </Pressable>

//             {/* Dropdown Options */}
//             {showUniversityDropdown && (
//               <View
//                 style={[
//                   styles.dropdownList,
//                   dynamicStyles.dropdown,
//                   styles.dropdownAbsolute,
//                 ]}
//               >
//                 {universities.map((uni) => (
//                   <Pressable
//                     key={uni.id}
//                     style={styles.dropdownItem}
//                     onPress={() => {
//                       setUniversity(uni.name);
//                       setUniversityID(uni.id);
//                       setShowUniversityDropdown(false);
//                     }}
//                   >
//                     <Text style={[styles.dropdownItemText, dynamicStyles.text]}>
//                       {uni.name}
//                     </Text>
//                     {university === uni.name && (
//                       <Ionicons name="checkmark" size={20} color="#00D084" />
//                     )}
//                   </Pressable>
//                 ))}
//               </View>
//             )}
//           </View>

//           {/* Send Verification Button */}
//           {!isLoading ? (
//             <Pressable
//               style={[
//                 styles.sendButton,
//                 (!fullName || !email || !university) &&
//                   styles.sendButtonDisabled,
//               ]}
//               onPress={handleSendVerification}
//               disabled={!fullName || !email || !university}
//             >
//               <Text style={styles.sendButtonText}>Send Verification Code</Text>
//             </Pressable>
//           ) : (
//             <View style={styles.sendButton}>
//               <ActivityIndicator color="#000000" size="small" />
//               <Text style={styles.sendButtonText}> Sending...</Text>
//             </View>
//           )}

//           {/* Sign In Link */}
//           <View style={styles.signInContainer}>
//             <Text style={[styles.signInText, dynamicStyles.subtitle]}>
//               Already have an account?{" "}
//             </Text>
//             <Pressable onPress={() => router.push("/(auth)/signin")}>
//               <Text style={styles.signInLink}>Sign in</Text>
//             </Pressable>
//           </View>
//         </View>
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   content: {
//     flex: 1,
//   },
//   contentContainer: {
//     paddingHorizontal: 24,
//     paddingTop: 60,
//     paddingBottom: 40,
//   },
//   header: {
//     alignItems: "center",
//     marginBottom: 48,
//   },
//   logo: {
//     width: 40,
//     height: 40,
//     marginBottom: 12,
//   },
//   appTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginTop: 16,
//   },
//   tagline: {
//     fontSize: 14,
//     marginTop: 8,
//   },
//   formSection: {
//     width: "100%",
//     borderWidth: 1,
//     borderRadius: 12,
//     padding: 20,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 8,
//     textAlign: "center",
//   },
//   sectionSubtitle: {
//     fontSize: 14,
//     marginBottom: 32,
//     textAlign: "center",
//   },
//   inputGroup: {
//     marginBottom: 12,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: "600",
//     marginBottom: 8,
//   },
//   input: {
//     height: 50,
//     borderRadius: 8,
//     borderWidth: 1,
//     paddingHorizontal: 16,
//     fontSize: 15,
//   },
//   dropdown: {
//     height: 50,
//     borderRadius: 8,
//     borderWidth: 1,
//     paddingHorizontal: 16,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   dropdownAbsolute: {
//     position: "absolute",
//     top: 58,
//     left: 0,
//     right: 0,
//     zIndex: 1000,
//   },
//   dropdownText: {
//     fontSize: 15,
//   },
//   dropdownList: {
//     marginTop: 8,
//     borderRadius: 8,
//     borderWidth: 1,
//     overflow: "hidden",
//   },
//   dropdownItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: "#333333",
//   },
//   dropdownItemText: {
//     fontSize: 15,
//   },
//   sendButton: {
//     backgroundColor: "#FFFFFF",
//     height: 50,
//     borderRadius: 8,
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 8,
//     flexDirection: "row",
//     gap: 8,
//   },
//   sendButtonDisabled: {
//     opacity: 0.5,
//   },
//   sendButtonText: {
//     color: "#000000",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   signInContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 24,
//   },
//   signInText: {
//     fontSize: 14,
//   },
//   signInLink: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#FFFFFF",
//   },
// });

// export default Signup;


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
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const UNIVERSITY_CACHE_KEY = "cached_universities";
const CACHE_EXPIRY_HOURS = 24;

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
    signInLink: {
      color: isDark? "#FFFFFF": "#000000"
    },
    verifyCode: {
      color: isDark? "#FFFFFF": "#000000"
    },
    sendButtonMain: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000"
    }
  };

  const fetchUniversities = async () => {
    try {
      setIsLoadingUniversities(true);

      const cachedData = await AsyncStorage.getItem(UNIVERSITY_CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const hoursSinceCache = (Date.now() - timestamp) / (1000 * 60 * 60);

        if (hoursSinceCache < CACHE_EXPIRY_HOURS) {
          setUniversities(data);
          setIsLoadingUniversities(false);
          return;
        }
      }

      const response = await axios.get<{
        status: string;
        data: UniversityGroup[];
      }>(`${UrlConstants.baseUrl}${UrlConstants.fetchAllUniversities}`);

      const allUniversities: University[] = response.data.data.flatMap(
        (group) => group.universities
      );

      setUniversities(allUniversities);

      await AsyncStorage.setItem(
        UNIVERSITY_CACHE_KEY,
        JSON.stringify({
          data: allUniversities,
          timestamp: Date.now(),
        })
      );
    } catch (error: any) {
      toast.error("Failed to load universities", {
        description: "Using default list",
      });
      setUniversities([
        {
          id: "68d1c6f462a47debb6446f05",
          name: "Louisiana Tech University",
          city: "Ruston",
          state: "Louisiana",
          country: "US",
        },
        {
          id: "68d1c80662a47debb6446f07",
          name: "Grambling State University",
          city: "North Central Louisiana",
          state: "Louisiana",
          country: "US",
        },
      ]);
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
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {universities.map((uni) => (
                    <Pressable
                      key={uni.id}
                      style={styles.dropdownItem}
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
              dynamicStyles.sendButtonMain,
              (!fullName || !email || !university || isLoadingUniversities) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSendVerification}
            disabled={!fullName || !email || !university || isLoadingUniversities}
          >
            <Text style={[styles.sendButtonText, dynamicStyles.verifyCode]}>
              Send Verification Code
            </Text>
          </Pressable>
          ) : (
            <View style={styles.sendButton}>
              <ActivityIndicator color="#000000" size="small" />
              <Text style={styles.sendButtonText}> Sending...</Text>
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
    maxHeight: 250,
  },
  dropdownScroll: {
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
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

  },
});

export default Signup;