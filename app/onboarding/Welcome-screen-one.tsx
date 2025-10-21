import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const WelcomeScreenOne = () => {
    const theme = useColorScheme() || 'light';
    const router = useRouter();
    const isDark = theme === 'dark';

    // Dynamic styles that need theme
    const dynamicStyles = {
        container: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
        },
        skipText: {
            color: isDark ? '#FFFFFF' : '#000000',
        },
        title: {
            color: isDark ? '#FFFFFF' : '#000000',
        },
        subtitle: {
            color: isDark ? '#CCCCCC' : '#666666',
        },
    };

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <Pressable 
                style={styles.skipButton}
                onPress={() => router.push('/onboarding/Welcome-screen-two')} // Fixed route
            >
                <Text style={[styles.skipText, dynamicStyles.skipText]}>Skip</Text>
            </Pressable>

            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image 
                        source={require('@/assets/images/tarpup-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                
                <Text style={[styles.title, dynamicStyles.title]}>How It Works</Text>
                
                <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
                    Connect with your campus community{'\n'}in 3 simple steps
                </Text>
            </View>

            <View style={styles.buttonContainer}>
                <Pressable 
                    style={styles.button}
                    onPress={() => router.push('/onboarding/Welcome-screen-two')}
                >
                    <Text style={styles.buttonText}>Let's go  →</Text>
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
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    skipText: {
        fontSize: 16,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 30,
        backgroundColor: '#333333',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 60,
        height: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 40,
        left: 24,
        right: 24,
    },
    button: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default WelcomeScreenOne;