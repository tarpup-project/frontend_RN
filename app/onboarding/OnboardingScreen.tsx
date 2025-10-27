import {
    Image,
    ImageSourcePropType,
    Pressable,
    StyleSheet,
    useColorScheme,
    View,
  } from "react-native";
  import { Text } from '@/components/Themedtext';
  
  interface OnboardingScreenProps {
    icon: ImageSourcePropType;
    iconDark: ImageSourcePropType;
    iconBgColor: string;
    title: string;
    subtitle: string;
    buttonText: string;
    onContinue: () => void;
    onSkip: () => void;
    hasChips?: boolean;
  }
  
  const OnboardingScreen = ({
    icon,
    iconDark,
    iconBgColor,
    title,
    subtitle,
    buttonText,
    onContinue,
    onSkip,
    hasChips = false,
  }: OnboardingScreenProps) => {
    const theme = useColorScheme() || "light";
    const isDark = theme === "dark";
  
    const dynamicStyles = {
      container: {
        backgroundColor: isDark ? "#000000" : "#FFFFFF",
      },
      skipText: {
        color: isDark ? "#FFFFFF" : "#000000",
      },
      title: {
        color: isDark ? "#FFFFFF" : "#000000",
      },
      subtitle: {
        color: isDark ? "#CCCCCC" : "#666666",
      },
      chip: {
        backgroundColor: isDark ? "#0D0D0D" : "#F5F5F5",
        borderColor: isDark ? "#333333" : "#E0E0E0",
      },
      chipText: {
        color: isDark ? "#FFFFFF" : "#000000",
      },
    };
  
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        {/* Skip Button */}
        <Pressable style={styles.skipButton} onPress={onSkip}>
          <Text style={[styles.skipText, dynamicStyles.skipText]}>Skip</Text>
        </Pressable>
  
        {/* Main Content */}
        <View style={styles.content}>
          <View style={[styles.logoContainer, { backgroundColor: iconBgColor }]}>
            <Image
              source={isDark ? iconDark : icon}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
  
          <Text style={[styles.title, dynamicStyles.title]}>{title}</Text>
  
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            {subtitle}
          </Text>
  
          {/* Example Chips - Only for screen 2 */}
          {hasChips && (
            <View style={styles.chipsContainer}>
              <View style={styles.chipRow}>
                <Pressable style={[styles.chip, dynamicStyles.chip]}>
                  <Text style={[styles.chipText, dynamicStyles.chipText]}>
                    "Sell a couch"
                  </Text>
                </Pressable>
                <Pressable style={[styles.chip, dynamicStyles.chip]}>
                  <Text style={[styles.chipText, dynamicStyles.chipText]}>
                    "Find a study partner"
                  </Text>
                </Pressable>
              </View>
              <View style={styles.chipRow}>
                <Pressable style={[styles.chip, dynamicStyles.chip]}>
                  <Text style={[styles.chipText, dynamicStyles.chipText]}>
                    "Plan events"
                  </Text>
                </Pressable>
                <Pressable style={[styles.chip, dynamicStyles.chip]}>
                  <Text style={[styles.chipText, dynamicStyles.chipText]}>
                    "Catch a ride"
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
  
        {/* Bottom Button */}
        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPress={onContinue}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </Pressable>
        </View>
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 60,
    },
    skipButton: {
      alignSelf: "flex-end",
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    skipText: {
      fontSize: 16,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingBottom: 120,
    },
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 30,
    },
    logo: {
      width: 50,
      height: 50,
    },
    title: {
      fontSize: 24,
      fontFamily: 'Geist-Bold',
      marginBottom: 16,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 30,
    },
    chipsContainer: {
      width: "100%",
      marginTop: 10,
    },
    chipRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
      marginBottom: 12,
    },
    chip: {
      width: 160,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 15,
      borderWidth: 1,
      alignItems: "center",
    },
    chipText: {
      fontSize: 11,
    },
    buttonContainer: {
      marginBottom: 30,
    },
    button: {
      backgroundColor: "#FFFFFF",
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    buttonText: {
      color: "#000000",
      fontSize: 16,
      fontWeight: "600",
    },
  });
  
  export default OnboardingScreen;