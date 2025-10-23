import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';

const PreviewModeBanner = () => {
    const theme = useColorScheme() || 'light';
    const isDark = theme === 'dark';
    const router = useRouter();

    const dynamicStyles = {
        container: {
            backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
            borderColor: isDark ? '#333333' : '#E0E0E0',
        },
        text: {
            color: isDark ? '#FFFFFF' : '#000000',
        },
        subtitle: {
            color: isDark ? '#CCCCCC' : '#666666',
        },
        button: {
            backgroundColor: isDark ? '#FFFFFF' : '#000000',
        },
        buttonText: {
            color: isDark ? '#000000' : '#FFFFFF',
        },
    };

    const handleSignUpPress = () => {
        router.push('/(auth)/Signup');
    };

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <View style={styles.leftContent}>
                <Ionicons 
                    name="eye-outline" 
                    size={20} 
                    color={dynamicStyles.text.color} 
                />
                <View style={styles.textContent}>
                    <View style={styles.titleRow}>
                        <Text style={styles.emoji}>👀</Text>
                        <Text style={[styles.title, dynamicStyles.text]}>
                            Preview Mode
                        </Text>                    
                    </View>
                    <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
                        Sign up to unlock all features
                    </Text>
                </View>
            </View>

            <Pressable 
                style={[styles.button, dynamicStyles.button]}
                onPress={handleSignUpPress}
            >
                <Text style={[styles.buttonText, dynamicStyles.buttonText]}>
                    Sign Up
                </Text>
                <Ionicons 
                    name="arrow-forward" 
                    size={16} 
                    color={dynamicStyles.buttonText.color} 
                />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    textContent: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    emoji: {
        fontSize: 14,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    buttonText: {
        fontSize: 13,
        fontWeight: '600',
    },
});

export default PreviewModeBanner;