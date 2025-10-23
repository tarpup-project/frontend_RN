import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const Header = () => {
    const theme = useColorScheme() || 'light';
    const router = useRouter();
    const isDark = theme === 'dark';
    
    const isAuthenticated = false;

    const handleChatPress = () => {
        if (!isAuthenticated) {
            router.push('/(auth)/Signup');
        } else {
            console.log('Navigate to chat');
        }
    };

    const handleThemeToggle = () => {
        console.log('Toggle theme');
    };

    const dynamicStyles = {
        container: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
            borderBottomColor: isDark ? '#333333' : '#E0E0E0',
        },
        title: {
            color: isDark ? '#FFFFFF' : '#000000',
        },
        icon: {
            color: isDark ? '#FFFFFF' : '#000000',
        },
    };

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <Text style={[styles.title, dynamicStyles.title]}>TarpAI Connect</Text>
            
            <View style={styles.iconsContainer}>
                <Pressable 
                    style={styles.iconButton}
                    onPress={handleThemeToggle}
                >
                    <Ionicons 
                        name={isDark ? 'moon' : 'sunny'} 
                        size={20} 
                        color={dynamicStyles.icon.color} 
                    />
                </Pressable>

                <Pressable 
                    style={styles.chatButton}
                    onPress={handleChatPress}
                >
                    <View style={styles.chatIconContainer}>
                        <Ionicons 
                            name="chatbubble-outline" 
                            size={20} 
                            color="#000000" 
                        />
                        {!isAuthenticated && (
                            <View style={styles.lockBadge}>
                                <Ionicons 
                                    name="lock-closed" 
                                    size={10} 
                                    color="#000000" 
                                />
                            </View>
                        )}
                    </View>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingTop: 50,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    iconsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        padding: 8,
    },
    chatButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 10,
        position: 'relative',
    },
    chatIconContainer: {
        position: 'relative',
    },
    lockBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 2,
    },
});

export default Header;