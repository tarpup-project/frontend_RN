import { useState } from 'react';
import { Text } from "@/components/Themedtext";
import { useTheme } from "@/app/contexts/ThemeContext";
import {
    View,
    TextInput,
    Pressable,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const RequestChat = () => {
    const { isDark } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();
    const [message, setMessage] = useState('');

    // Get prompt title from params (passed from prompts page)
    const promptTitle = params.title as string || "this prompt";

    const actionButtons = [
        { text: 'Find more matches', row: 1 },
        { text: 'Meet new people', row: 1 },
        { text: 'Browse other needs', row: 2 },
        { text: 'Go to groups', row: 2 },
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
        aiMessageContainer: {
            backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
        },
        actionButton: {
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

    const handleActionPress = (text: string) => {
        console.log('Action pressed:', text);
        // Handle navigation based on button
        if (text === 'Go to groups') {
            router.push('/(tabs)/groups');
        } else if (text === 'Browse other needs') {
            router.push('/(tabs)');
        }
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
                {/* AI Response Message */}
                <View style={styles.aiMessageSection}>
                    <View style={styles.aiAvatarContainer}>
                        <View style={styles.aiAvatar}>
                            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                        </View>
                    </View>
                    <View style={styles.aiMessageWrapper}>
                        <View style={[styles.aiMessageContainer, dynamicStyles.aiMessageContainer]}>
                            <View style={styles.successIconContainer}>
                                <Ionicons name="checkmark-circle" size={16} color="#00D084" />
                            </View>
                            <Text style={[styles.aiMessageText, dynamicStyles.text]}>
                                <Text style={styles.boldText}>Great!</Text> Your request has been shared with the student. 
                                You will be notified when they accept, and you'll be automatically added to a group chat together. 
                                TarpAI will continue working in the background to find more compatible matches for you!
                            </Text>
                        </View>
                        
                        {/* Action Buttons */}
                        <View style={styles.actionButtonsContainer}>
                            {actionButtons.map((button, index) => (
                                <Pressable
                                    key={index}
                                    style={[styles.actionButton, dynamicStyles.actionButton]}
                                    onPress={() => handleActionPress(button.text)}
                                >
                                    <Text style={[styles.actionButtonText, dynamicStyles.text]}>
                                        {button.text}
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
                        placeholder="Ask anything..."
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
        flex: 1,
    },
    aiMessageContainer: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    successIconContainer: {
        marginBottom: 8,
    },
    aiMessageText: {
        fontSize: 13,
        lineHeight: 20,
    },
    boldText: {
        fontWeight: '600',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: '48%',
        flexBasis: '48%',
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 12,
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

export default RequestChat; 