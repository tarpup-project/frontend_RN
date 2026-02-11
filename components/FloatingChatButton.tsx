import AuthModal from "@/components/AuthModal";
import { useTheme } from "@/contexts/ThemeContext";
import { usePendingMatches } from "@/hooks/usePendingMatches";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const FloatingChatButton = () => {
    const router = useRouter();
    const { isDark } = useTheme();
    const { isAuthenticated } = useAuthStore();
    const { pendingMatches, unviewedCount } = usePendingMatches();
    const [showAuthModal, setShowAuthModal] = useState(false);

    const unviewedMatchesCount = unviewedCount !== undefined ? unviewedCount : pendingMatches?.length || 0;

    const handlePress = () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
        } else {
            router.push("/chat");
        }
    };

    const dynamicStyles = {
        button: {
            backgroundColor: isDark ? "#FFFFFF" : "#0a0a0a",
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 4.65,
            elevation: 8,
        },
        icon: {
            color: isDark ? "#0a0a0a" : "#FFFFFF",
        }
    };

    return (
        <>
            <Pressable
                style={[styles.container, dynamicStyles.button]}
                onPress={handlePress}
            >
                <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={28}
                    color={dynamicStyles.icon.color}
                />

                {unviewedMatchesCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {unviewedMatchesCount > 9 ? '9+' : unviewedMatchesCount}
                        </Text>
                    </View>
                )}
            </Pressable>

            <AuthModal
                visible={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    badge: {
        position: "absolute",
        top: -5,
        right: -5,
        backgroundColor: "#EF4444",
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    badgeText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "700",
    },
});

export default FloatingChatButton;
