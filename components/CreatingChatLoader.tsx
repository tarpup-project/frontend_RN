import { useTheme } from "@/contexts/ThemeContext";
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface CreatingChatLoaderProps {
    name: string;
}

export const CreatingChatLoader: React.FC<CreatingChatLoaderProps> = ({ name }) => {
    const { isDark } = useTheme();

    // Text segments
    const titleText = "Hurray! 🥳";
    const prefix = "Your chat with ";
    const suffix = " is being created...";

    // State for typing animation
    const [displayedTitle, setDisplayedTitle] = useState("");
    const [displayedPrefix, setDisplayedPrefix] = useState("");
    const [displayedName, setDisplayedName] = useState("");
    const [displayedSuffix, setDisplayedSuffix] = useState("");
    const [isTypingDone, setIsTypingDone] = useState(false);

    const cursorOpacity = useRef(new Animated.Value(1)).current;
    const timeouts = useRef<NodeJS.Timeout[]>([]);

    // Blinking cursor animation
    useEffect(() => {
        const blink = Animated.loop(
            Animated.sequence([
                Animated.timing(cursorOpacity, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(cursorOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        );
        blink.start();
        return () => blink.stop();
    }, []);

    useEffect(() => {
        // Reset
        setDisplayedTitle("");
        setDisplayedPrefix("");
        setDisplayedName("");
        setDisplayedSuffix("");
        setIsTypingDone(false);
        timeouts.current.forEach(clearTimeout);
        timeouts.current = [];

        let currentDelay = 0;
        const typeSpeed = 40; // ms per char
        const commaPause = 300;

        // Helper to schedule typing for a string segment
        // We return the end time so we know when to start the next segment
        const scheduleTyping = (text: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
            text.split('').forEach((char, index) => {
                const timeout = setTimeout(() => {
                    setter(prev => prev + char);
                }, currentDelay);
                timeouts.current.push(timeout);
                currentDelay += typeSpeed;
            });
        };

        // 1. Type Title
        scheduleTyping(titleText, setDisplayedTitle);

        // Pause a bit after title
        currentDelay += commaPause;

        // 2. Type Prefix
        scheduleTyping(prefix, setDisplayedPrefix);

        // 3. Type Name
        scheduleTyping(name, setDisplayedName);

        // 4. Type Suffix
        scheduleTyping(suffix, setDisplayedSuffix);

        // Mark as done
        const doneTimeout = setTimeout(() => {
            setIsTypingDone(true);
        }, currentDelay);
        timeouts.current.push(doneTimeout);

        return () => {
            timeouts.current.forEach(clearTimeout);
        };
    }, [name]);

    return (
        <View style={[styles.container, { backgroundColor: isDark ? "#000000" : "#FFFFFF" }]}>
            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                        {displayedTitle}
                    </Text>

                    <Text style={[styles.subtitle, { color: isDark ? "#9AA0A6" : "#666666" }]}>
                        {displayedPrefix}
                        <Text style={[styles.nameHighlight, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                            {displayedName}
                        </Text>
                        {displayedSuffix}
                        <Animated.Text style={[styles.cursor, { opacity: cursorOpacity, color: isDark ? "#FFFFFF" : "#000000" }]}>
                            |
                        </Animated.Text>
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 16,
        width: '100%',
    },
    textContainer: {
        alignItems: 'center', // Center text horizontally
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 16,
        height: 34, // Fixed height to prevent jumpiness
    },
    subtitle: {
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 26,
    },
    nameHighlight: {
        fontWeight: '700',
    },
    cursor: {
        fontWeight: '200',
    },
});
