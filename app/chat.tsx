import { useState } from 'react';
import { Text } from "@/components/Themedtext";
import {
    View,
    TextInput,
    Pressable,
    StyleSheet,
    ScrollView,
    useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const Chat = () => {
    const theme = useColorScheme() || 'light';
    const isDark = theme === 'dark';
    const router = useRouter();
    const [message, setMessage] = useState('');

    const quickStartOptions = [
        { icon: 'car-outline', text: 'I need a ride to downtown' },
        { icon: 'home-outline', text: 'Looking for a roommate' },
        { icon: 'people-outline', text: 'Want to join a Study group' },
        { icon: 'heart-outline', text: 'Find a Date' },
        { icon: 'book-outline', text: 'Need to Sell My textbooks' },
    ];

    const aiResponseButtons = [
        'Find a role',
        'Get a roommate',
        'Join Study Group',
    ];

    const bottomActions = [
        'Meet new people',
        'Sell/buy items',
    ];

    const dynamicStyles = {
        container: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
        },
        header: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
            borderBottomColor: isDark ? '#333333' : '#E0E0E0',
        },
        text: {
            color: isDark ? '#FFFFFF' : '#000000',
        },
        subtitle: {
            color: isDark ? '#CCCCCC' : '#666666',
        },
        quickStartButton: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
            borderColor: isDark ? '#333333' : '#E0E0E0',
        },
        aiMessageContainer: {
            backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
        },
        aiButton: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
            borderColor: isDark ? '#333333' : '#E0E0E0',
        },
        input: {
            backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
            borderColor: isDark ? '#333333' : '#E0E0E0',
            color: isDark ? '#FFFFFF' : '#000000',
        },
        sendButton: {
            backgroundColor: isDark ? '#FFFFFF' : '#000000',
        },
        sendIcon: {
            color: isDark ? '#000000' : '#FFFFFF',
        },
    };

    const handleClose = () => {
        router.back();
    };

    const handleQuickStartPress = (text: string) => {
        console.log('Quick start pressed:', text);
    };

    const handleAiButtonPress = (text: string) => {
        console.log('AI button pressed:', text);
    };

    const handleBottomActionPress = (text: string) => {
        console.log('Bottom action pressed:', text);
    };

    const handleSend = () => {
        if (message.trim()) {
            console.log('Send message:', message);
            setMessage('');
        }
    };

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            {/* Header */}
            <View style={[styles.header, dynamicStyles.header]}>
                <Text style={[styles.headerTitle, dynamicStyles.text]}>
                    Chat with TarpAI
                </Text>
                <Pressable style={styles.closeButton} onPress={handleClose}>
                    <Ionicons 
                        name="close" 
                        size={24} 
                        color={dynamicStyles.text.color} 
                    />
                </Pressable>
            </View>

            <ScrollView 
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Quick Start Section */}
                <View style={styles.quickStartSection}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>
                        Quick Start
                    </Text>
                    <View style={styles.quickStartGrid}>
                        {quickStartOptions.map((option, index) => (
                            <Pressable
                                key={index}
                                style={[styles.quickStartButton, dynamicStyles.quickStartButton]}
                                onPress={() => handleQuickStartPress(option.text)}
                            >
                                <Ionicons 
                                    name={option.icon as any} 
                                    size={14} 
                                    color={dynamicStyles.text.color} 
                                />
                                <Text style={[styles.quickStartText, dynamicStyles.text]}>
                                    {option.text}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* AI Introductory Message */}
                <View style={styles.aiMessageSection}>
                    <View style={styles.aiAvatarContainer}>
                        <View style={styles.aiAvatar}>
                            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                        </View>
                    </View>
                    <View style={styles.aiMessageWrapper}>
                        <View style={[styles.aiMessageContainer, dynamicStyles.aiMessageContainer]}>
                            <Text style={[styles.aiMessageText, dynamicStyles.text]}>
                                Hi! I'm TarpAI, your smart campus connection assistant. 
                                I help you find compatible students based on your needs. 
                                What would you like help with today?
                            </Text>
                        </View>
                        
                        {/* AI Response Buttons */}
                        <View style={styles.aiButtonsContainer}>
                            {aiResponseButtons.map((button, index) => (
                                <Pressable
                                    key={index}
                                    style={[styles.aiButton, dynamicStyles.aiButton]}
                                    onPress={() => handleAiButtonPress(button)}
                                >
                                    <Text style={[styles.aiButtonText, dynamicStyles.text]}>
                                        {button}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        {/* Bottom Action Buttons */}
                        <View style={styles.bottomActionsContainer}>
                            {bottomActions.map((action, index) => (
                                <Pressable
                                    key={index}
                                    style={[styles.bottomActionButton, dynamicStyles.aiButton]}
                                    onPress={() => handleBottomActionPress(action)}
                                >
                                    <Text style={[styles.bottomActionText, dynamicStyles.text]}>
                                        {action}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Input Section */}
            <View style={styles.inputSection}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, dynamicStyles.input]}
                        placeholder="Tell TarpAI what you need..."
                        placeholderTextColor={isDark ? '#666666' : '#999999'}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />
                    <Pressable 
                        style={[styles.sendButton, dynamicStyles.sendButton]}
                        onPress={handleSend}
                    >
                        <Ionicons 
                            name="send" 
                            size={20} 
                            color={dynamicStyles.sendIcon.color} 
                        />
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    quickStartSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    quickStartGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    quickStartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: '48%',
        flexBasis: '48%',
    },
    quickStartText: {
        fontSize: 11,
        flex: 1,
    },
    aiMessageSection: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    aiAvatarContainer: {
        paddingTop: 4,
    },
    aiAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#6B46C1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiMessageWrapper: {
        width: '80%',
    },
    aiMessageContainer: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    aiMessageText: {
        fontSize: 12,
        lineHeight: 18,
    },
    aiButtonsContainer: {
        gap: 6,
        marginBottom: 8,
    },
    aiButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    aiButtonText: {
        fontSize: 11,
        fontWeight: '500',
    },
    bottomActionsContainer: {
        gap: 6,
    },
    bottomActionButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    bottomActionText: {
        fontSize: 11,
        fontWeight: '500',
    },
    inputSection: {
        padding: 16,
        paddingBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    input: {
        flex: 1,
        minHeight: 50,
        maxHeight: 100,
        borderRadius: 25,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
    },
    sendButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Chat;