import { View, Text, Image, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const WelcomeScreenTwo = () => {
    const theme = useColorScheme() || 'light';
    const router = useRouter();
    const isDark = theme === 'dark';

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
        chip: {
            backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
            borderColor: isDark ? '#333333' : '#E0E0E0',
        },
        chipText: {
            color: isDark ? '#FFFFFF' : '#000000',
        },
    };

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            {/* Skip Button */}
            <Pressable 
                style={styles.skipButton}
                onPress={() => router.push('/onboarding/Welcome-screen-three')}
            >
                <Text style={[styles.skipText, dynamicStyles.skipText]}>Skip</Text>
            </Pressable>

            {/* Navigation Arrows */}
            <Pressable 
                style={styles.leftArrow}
                onPress={() => router.back()}
            >
                <Text style={[styles.arrowText, dynamicStyles.skipText]}>‹</Text>
            </Pressable>

            <Pressable 
                style={styles.rightArrow}
                onPress={() => router.push('/onboarding/Welcome-screen-three')}
            >
                <Text style={[styles.arrowText, dynamicStyles.skipText]}>›</Text>
            </Pressable>

            {/* Main Content */}
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image 
                        source={
                            isDark 
                                ? require('@/assets/images/logo-dark.png')
                                : require('@/assets/images/logo-light.png')
                        }
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                
                <Text style={[styles.title, dynamicStyles.title]}>
                    Just state your need
                </Text>
                
                <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
                    Simply type what you're looking for in natural{'\n'}language.
                </Text>

                {/* Example Chips */}
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
            </View>

            {/* Progress Dots */}
            <View style={styles.dotsContainer}>
                <View style={styles.dotInactive} />
                <View style={styles.dotActive} />
                <View style={styles.dotInactive} />
            </View>

            {/* Bottom Button */}
            <View style={styles.buttonContainer}>
                <Pressable 
                    style={styles.button}
                    onPress={() => router.push('/onboarding/Welcome-screen-three')}
                >
                    <Text style={styles.buttonText}>Continue  →</Text>
                </Pressable>
            </View>

            {/* Bottom Icons */}
            <View style={styles.bottomIcons}>
                <Pressable>
                    <Text style={styles.iconText}>🏠</Text>
                </Pressable>
                <Pressable>
                    <Text style={styles.iconText}>🔄</Text>
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
    leftArrow: {
        position: 'absolute',
        left: 8,
        top: '50%',
        padding: 16,
        zIndex: 10,
    },
    rightArrow: {
        position: 'absolute',
        right: 8,
        top: '50%',
        padding: 16,
        zIndex: 10,
    },
    arrowText: {
        fontSize: 32,
        fontWeight: '300',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 120,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 25,
        backgroundColor: '#87CEEB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        width: 50,
        height: 50,
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
        marginBottom: 30,
    },
    chipsContainer: {
        width: '100%',
        marginTop: 10,
    },
    chipRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 12,
    },
    chip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 14,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    dotActive: {
        width: 32,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
    },
    dotInactive: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#666666',
    },
    buttonContainer: {
        marginBottom: 20,
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
    bottomIcons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        paddingBottom: 20,
    },
    iconText: {
        fontSize: 24,
    },
});

export default WelcomeScreenTwo;