import { Text } from "@/components/Themedtext";
import { LinearGradient } from "expo-linear-gradient";
import { MessageSquare, UsersRound } from "lucide-react-native";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

interface OnboardingScreenProps {
  icon: ImageSourcePropType | string;
  iconDark: ImageSourcePropType | string;
  iconBgColor: string | string[];
  title: string;
  subtitle: string;
  buttonText: string;
  onContinue: () => void;
  onSkip: () => void;
  hasChips?: boolean;
  isLucideIcon?: boolean;
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
  isLucideIcon = false,
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

  const renderIcon = () => {
    const iconToRender = isDark ? iconDark : icon;
    
    // Handle Lucide icons
    if (typeof iconToRender === 'string') {
      const iconColor = isDark ? "#FFFFFF" : "#000000";
      
      if (iconToRender === 'MessageSquare') {
        return <MessageSquare size={50} color={iconColor} strokeWidth={2} />;
      }
      if (iconToRender === 'UsersRound') {
        return <UsersRound size={50} color={iconColor} strokeWidth={2} />;
      }
    }
    
    // Otherwise render image
    return (
      <Image
        source={iconToRender as ImageSourcePropType}
        style={styles.logo}
        resizeMode="contain"
      />
    );
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Skip Button */}
      <Pressable style={styles.skipButton} onPress={onSkip}>
        <Text style={[styles.skipText, dynamicStyles.skipText]}>Skip</Text>
      </Pressable>

      {/* Main Content */}
      <View style={styles.content}>
        {Array.isArray(iconBgColor) ? (
          <LinearGradient
            colors={iconBgColor as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoContainer}
          >
            {renderIcon()}
          </LinearGradient>
        ) : (
          <View
            style={[styles.logoContainer, { backgroundColor: iconBgColor }]}
          >
            {renderIcon()}
          </View>
        )}

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
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>{buttonText}</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </View>
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
    fontFamily: "Geist-Bold",
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
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  arrowIcon: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "600",
  },
});

export default OnboardingScreen;