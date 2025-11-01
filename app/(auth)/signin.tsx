// import { Ionicons } from "@expo/vector-icons";
// import { useTheme } from "@/app/contexts/ThemeContext";
// import { useRouter } from "expo-router";
// import { Text } from "@/components/Themedtext";
// import { useState } from "react";
// import {
//   ActivityIndicator,
//   Pressable,
//   StyleSheet,
//   TextInput,
//   KeyboardAvoidingView,
//   Platform,
//   View,
// } from "react-native";
// import { toast } from "sonner-native";
// import axios from "axios";
// import { UrlConstants } from "@/constants/apiUrls";

// const SignIn = () => {
//   const { isDark } = useTheme();
//   const router = useRouter();

//   const [email, setEmail] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

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
//   };

//   const validateEmail = (email: string): boolean => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
//   };

//   const handleContinue = async () => {
//     if (!email) {
//       toast.error("Please enter your email address");
//       return;
//     }

//     if (!validateEmail(email)) {
//       toast.error("Please enter a valid email address");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const response = await axios.post(
//         `${UrlConstants.baseUrl}/user/resend-otp`,
//         {
//           email: email,
//           mode: "signin",
//         }
//       );

//       if (response.data.status === "success") {
//         toast.success("Verification code sent!", {
//           description: "Check your email for the 6-digit code",
//         });

//         setTimeout(() => {
//           router.push({
//             pathname: "/(auth)/verify-signin",
//             params: { email },
//           });
//         }, 1000);
//       }
//     } catch (error: any) {
//       const errorMessage =
//         error?.response?.data?.message || "Please try again";

//       toast.error("Failed to send verification code", {
//         description: errorMessage,
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={[styles.container, dynamicStyles.container]}
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//     >
//       <View style={styles.content}>
//         <View style={styles.header}>
//           <Text style={[styles.appTitle, dynamicStyles.text]}>
//             TarpAI Connect
//           </Text>
//           <Text style={[styles.tagline, dynamicStyles.subtitle]}>
//             Smart campus connections powered by AI
//           </Text>
//         </View>

//         <View
//           style={[styles.signInSection, styles.signInBox, dynamicStyles.input]}
//         >
//           <View style={styles.iconContainer}>
//             <Ionicons
//               name="mail-outline"
//               size={48}
//               color={dynamicStyles.text.color}
//             />
//           </View>

//           <Text style={[styles.title, dynamicStyles.text]}>
//             Sign In to Your Account
//           </Text>
//           <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
//             We'll send a 6-digit code to
//           </Text>

//           <View style={styles.inputGroup}>
//             <Text style={[styles.label, dynamicStyles.text]}>
//               University Email
//             </Text>
//             <TextInput
//               style={[styles.input, dynamicStyles.input]}
//               placeholder="your.email@university.edu"
//               placeholderTextColor={isDark ? "#666666" : "#999999"}
//               value={email}
//               onChangeText={setEmail}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               editable={!isLoading}
//             />
//           </View>

//           {!isLoading ? (
//             <Pressable
//               style={[
//                 styles.continueButton,
//                 !email && styles.continueButtonDisabled,
//               ]}
//               onPress={handleContinue}
//               disabled={!email}
//             >
//               <Text style={styles.continueButtonText}>Send Code</Text>
//             </Pressable>
//           ) : (
//             <View style={styles.continueButton}>
//               <ActivityIndicator color="#000000" size="small" />
//               <Text style={styles.continueButtonText}> Sending...</Text>
//             </View>
//           )}

//           <View style={styles.signUpContainer}>
//             <Text style={[styles.signUpText, dynamicStyles.subtitle]}>
//               Don't have an account?{" "}
//             </Text>
//             <Pressable onPress={() => router.back()}>
//               <Text style={styles.signUpLink}>Sign up</Text>
//             </Pressable>
//           </View>
//         </View>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 24,
//     paddingTop: 120,
//   },
//   header: {
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   appTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//   },
//   tagline: {
//     fontSize: 14,
//     marginTop: 8,
//   },
//   iconContainer: {
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   signInSection: {
//     width: "100%",
//   },
//   signInBox: {
//     borderWidth: 1,
//     borderRadius: 12,
//     padding: 20,
//   },
//   title: {
//     fontSize: 15,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: 6,
//   },
//   subtitle: {
//     fontSize: 14,
//     textAlign: "center",
//     marginBottom: 12,
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
//     height: 45,
//     borderRadius: 8,
//     borderWidth: 1,
//     paddingHorizontal: 16,
//     fontSize: 15,
//     textAlign: "center",
//   },
//   continueButton: {
//     backgroundColor: "#FFFFFF",
//     height: 50,
//     borderRadius: 8,
//     justifyContent: "center",
//     alignItems: "center",
//     flexDirection: "row",
//     gap: 8,
//   },
//   continueButtonDisabled: {
//     opacity: 0.5,
//   },
//   continueButtonText: {
//     color: "#000000",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   signUpContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 16,
//   },
//   signUpText: {
//     fontSize: 14,
//   },
//   signUpLink: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#FFFFFF",
//   },
// });

// export default SignIn;

import { useTheme } from "@/app/contexts/ThemeContext";
import { Text } from "@/components/Themedtext";
import { UrlConstants } from "@/constants/apiUrls";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import { useState } from "react";
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

const SignIn = () => {
  const { isDark } = useTheme();
  const router = useRouter();

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
    emailInputContainer: {
      borderColor: isDark ? "#666666" : "#999999",
      backgroundColor: isDark ? "#000000" : "#F5F5F5",
    },
    placeholderText: {
      color: isDark? "#CCCCCC" : "#CCCCCC"
    }
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
      const response = await axios.post(
        `${UrlConstants.baseUrl}/user/resend-otp`,
        {
          email: email,
          mode: "signin",
        }
      );

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
            <View
              style={[
                styles.emailInputContainer,
                dynamicStyles.emailInputContainer,
              ]}
            >
              <Text style={[styles.emailDisplay, dynamicStyles.placeholderText]}>
                {email || "your.email@university.edu"}
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
              />
            </View>
            <Text style={[styles.hint, dynamicStyles.subtitle]}>
              We will send a verification code to confirm it is you
            </Text>
          </View>

          {!isLoading ? (
            <Pressable
              style={[
                styles.continueButton,
                !email && styles.continueButtonDisabled,
              ]}
              onPress={handleContinue}
              disabled={!email}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#000000" />
            </Pressable>
          ) : (
            <View style={styles.continueButton}>
              <ActivityIndicator color="#000000" size="small" />
              <Text style={styles.continueButtonText}> Sending...</Text>
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
              Do not have an account?{" "}
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.signUpLink}>Sign Up</Text>
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
    paddingTop: 200,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 18,
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
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
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
  emailDisplay: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  input: {
    height: 45,
    borderRadius: 8,
    borderWidth: 0,
    paddingHorizontal: 16,
    fontSize: 15,
    textAlign: "center",
    position: "absolute",
    opacity: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hint: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  continueButton: {
    backgroundColor: "#FFFFFF",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  continueButtonDisabled: {
    opacity: 0.5,
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
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    borderRadius: 6,
  },
  securityText: {
    fontSize: 12,
  },
  emailInputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
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
