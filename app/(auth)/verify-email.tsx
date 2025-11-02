// import { useTheme } from "@/app/contexts/ThemeContext";
// import { Text } from "@/components/Themedtext";
// import { Ionicons } from "@expo/vector-icons";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { useState } from "react";
// import {
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   StyleSheet,
//   TextInput,
//   View,
// } from "react-native";
// import { toast } from "sonner-native";
// import axios from "axios";
// import { UrlConstants } from "@/constants/apiUrls";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// const VerifyEmail = () => {
//   const { isDark } = useTheme();
//   const router = useRouter();
//   const params = useLocalSearchParams();

//   const email = params.email as string;

//   const [verificationCode, setVerificationCode] = useState("");
//   const [isVerifying, setIsVerifying] = useState(false);
//   const [isResending, setIsResending] = useState(false);

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
//     codeDisplay: {
//       backgroundColor: isDark ? "#000000" : "#F5F5F5",
//     },
//     verifyButton: {
//       backgroundColor: isDark ? "#FFFFFF" : "#000000"
//     },
//     verifyButtonText: {
//       color: isDark ? "#000000" : "#FFFFFF"
//     }
//   };

//   const handleVerifyEmail = async () => {
//     if (verificationCode.length !== 6) {
//       toast.error("Please enter the complete 6-digit code");
//       return;
//     }
  
//     console.log("Verifying OTP:", { email, token: verificationCode });
    
//     setIsVerifying(true);
//     try {
//       const response = await axios.post(
//         `${UrlConstants.baseUrl}/user/verify`,
//         {
//           email: email,
//           token: verificationCode,
//         }
//       );
  
//       console.log("Verify response:", response.data);
  
//       if (response.data.status === "success") {
//         const userData = response.data.data;
        
//         await AsyncStorage.setItem("user", JSON.stringify(userData));
  
//         toast.success("Email verified!", {
//           description: "Your account has been created successfully",
//         });
  
//         setTimeout(() => {
//           router.replace("/(auth)/signup-success");
//         }, 800);
//       }
//     } catch (error: any) {
//       console.log("Verify error:", error);
//       console.log("Error response:", error?.response?.data);
      
//       const errorMessage =
//         error?.response?.data?.message || "Invalid code. Please try again.";
  
//       toast.error("Verification failed", {
//         description: errorMessage,
//       });
//       setVerificationCode("");
//     } finally {
//       setIsVerifying(false);
//     }
//   };

//   const handleResendCode = async () => {
//     setIsResending(true);
//     try {
//       const response = await axios.post(
//         `${UrlConstants.baseUrl}/user/resend-otp`,
//         {
//           email: email,
//           mode: "signup",
//         }
//       );

//       if (response.data.status === "success") {
//         toast.success("Code resent!", {
//           description: "Check your email for the new code",
//         });
//       }
//     } catch (error: any) {
//       const errorMessage =
//         error?.response?.data?.message || "Please try again";

//       toast.error("Failed to resend code", {
//         description: errorMessage,
//       });
//     } finally {
//       setIsResending(false);
//     }
//   };

//   const handleChangeEmail = () => {
//     router.back();
//   };

//   return (
//     <KeyboardAvoidingView
//       style={[styles.container, dynamicStyles.container]}
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//     >
//       <View style={styles.content}>
//         <View style={styles.header}>
//           <View style={styles.titleRow}>
//             <Text style={[styles.appTitle, dynamicStyles.text]}>
//               TarpAI Connect
//             </Text>
//           </View>
//           <Text style={[styles.tagline, dynamicStyles.subtitle]}>
//             Join Your Campus Community
//           </Text>
//         </View>

//         <View
//           style={[styles.verifySection, styles.verifyBox, dynamicStyles.input]}
//         >
//           <View style={styles.iconContainer}>
//             <Ionicons
//               name="mail-outline"
//               size={48}
//               color={dynamicStyles.text.color}
//             />
//           </View>

//           <Text style={[styles.title, dynamicStyles.text]}>
//             Verify Your Email
//           </Text>
//           <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
//             We've sent a 6-digit code to
//           </Text>
//           <Text style={[styles.email, dynamicStyles.text]}>{email}</Text>

//           <View style={styles.inputGroup}>
//             <Text style={[styles.label, dynamicStyles.text]}>
//               Verification Code
//             </Text>
//             <TextInput
//               style={[styles.input, dynamicStyles.input]}
//               placeholder="Enter 6-digit code"
//               placeholderTextColor={isDark ? "#666666" : "#999999"}
//               value={verificationCode}
//               onChangeText={setVerificationCode}
//               keyboardType="number-pad"
//               maxLength={6}
//               editable={!isVerifying}
//               autoFocus
//             />
//           </View>

//           {!isVerifying ? (
//   <Pressable
//     style={[
//       styles.verifyButton,
//       dynamicStyles.verifyButton,
//       verificationCode.length !== 6 && styles.verifyButtonDisabled,
//     ]}
//     onPress={handleVerifyEmail}
//     disabled={verificationCode.length !== 6}
//   >
//     <Text style={[styles.verifyButtonText, dynamicStyles.verifyButtonText]}>
//       Verify Email
//     </Text>
//   </Pressable>
// ) : (
//   <View style={[styles.verifyButton, dynamicStyles.verifyButton]}>
//     <ActivityIndicator color={isDark ? "#000000" : "#FFFFFF"} size="small" />
//     <Text style={[styles.verifyButtonText, dynamicStyles.verifyButtonText]}>
//       {" "}Verifying...
//     </Text>
//   </View>
// )}

//           <Pressable
//             style={styles.resendContainer}
//             onPress={handleResendCode}
//             disabled={isResending || isVerifying}
//           >
//             <Text
//               style={[
//                 styles.resendText,
//                 dynamicStyles.text,
//                 (isResending || isVerifying) && { opacity: 0.5 },
//               ]}
//             >
//               {isResending ? "Sending..." : "Resend code"}
//             </Text>
//           </Pressable>

//           <Pressable
//             style={styles.changeEmailContainer}
//             onPress={handleChangeEmail}
//             disabled={isVerifying}
//           >
//             <Text style={[styles.changeEmailText, dynamicStyles.subtitle]}>
//               Change email address
//             </Text>
//           </Pressable>
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
//   titleRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   logo: {
//     width: 32,
//     height: 32,
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
//   verifySection: {
//     width: "100%",
//   },
//   verifyBox: {
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
//     marginBottom: 4,
//   },
//   email: {
//     fontSize: 15,
//     fontWeight: "600",
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
//     fontSize: 18,
//     letterSpacing: 2,
//     textAlign: "center",
//   },
//   verifyButton: {
//     height: 50,
//     borderRadius: 8,
//     justifyContent: "center",
//     alignItems: "center",
//     flexDirection: "row",
//     gap: 8,
//   },
//   verifyButtonDisabled: {
//     opacity: 0.5,
//   },
//   verifyButtonText: {
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   resendContainer: {
//     alignItems: "center",
//     marginTop: 10,
//   },
//   resendText: {
//     fontSize: 15,
//     fontWeight: "600",
//   },
//   changeEmailContainer: {
//     alignItems: "center",
//     marginTop: 8,
//   },
//   changeEmailText: {
//     fontSize: 14,
//   },
// });

// export default VerifyEmail;



import { useTheme } from "@/app/contexts/ThemeContext";
import { Text } from "@/components/Themedtext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import axios from "axios";
import { UrlConstants } from "@/constants/apiUrls";
import { saveUserData } from "@/utils/storage";

const VerifyEmail = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const email = params.email as string;

  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

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
    verifyButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    verifyButtonText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
  };

  const handleVerifyEmail = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    console.log("Verifying OTP:", { email, token: verificationCode });

    setIsVerifying(true);
    try {
      const response = await axios.post(
        `${UrlConstants.baseUrl}/user/verify`,
        {
          email: email,
          token: verificationCode,
        }
      );

      console.log("Verify response:", response.data);

      if (response.data.status === "success") {
        const userData = response.data.data;
        await saveUserData(userData);

        toast.success("Email verified!", {
          description: "Your account has been created successfully",
        });

        setTimeout(() => {
          router.replace("/(auth)/signup-success");
        }, 800);
      }
    } catch (error: any) {
      console.log("Verify error:", error);
      console.log("Error response:", error?.response?.data);

      const errorMessage =
        error?.response?.data?.message || "Invalid code. Please try again.";

      toast.error("Verification failed", {
        description: errorMessage,
      });
      setVerificationCode("");
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
          mode: "signup",
        }
      );

      if (response.data.status === "success") {
        toast.success("Code resent!", {
          description: "Check your email for the new code",
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Please try again";

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
          <View style={styles.titleRow}>
            <Text style={[styles.appTitle, dynamicStyles.text]}>
              TarpAI Connect
            </Text>
          </View>
          <Text style={[styles.tagline, dynamicStyles.subtitle]}>
            Join Your Campus Community
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
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder="Enter 6-digit code"
              placeholderTextColor={isDark ? "#666666" : "#999999"}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isVerifying}
              autoFocus
            />
          </View>

          {!isVerifying ? (
            <Pressable
              style={[
                styles.verifyButton,
                dynamicStyles.verifyButton,
                verificationCode.length !== 6 && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerifyEmail}
              disabled={verificationCode.length !== 6}
            >
              <Text
                style={[styles.verifyButtonText, dynamicStyles.verifyButtonText]}
              >
                Verify Email
              </Text>
            </Pressable>
          ) : (
            <View style={[styles.verifyButton, dynamicStyles.verifyButton]}>
              <ActivityIndicator
                color={isDark ? "#000000" : "#FFFFFF"}
                size="small"
              />
              <Text
                style={[styles.verifyButtonText, dynamicStyles.verifyButtonText]}
              >
                {" "}
                Verifying...
              </Text>
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
              {isResending ? "Sending..." : "Resend code"}
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
    fontSize: 18,
    letterSpacing: 2,
    textAlign: "center",
  },
  verifyButton: {
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
