import { Tabs } from 'expo-router';
import { useTheme } from "@/app/contexts/ThemeContext";
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
    const { isDark } = useTheme();
        
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: isDark ? '#FFFFFF' : '#000000',
                tabBarInactiveTintColor: isDark ? '#666666' : '#999999',
                tabBarStyle: {
                    backgroundColor: isDark ? '#000000' : '#FFFFFF',
                    borderTopColor: isDark ? '#333333' : '#E0E0E0',
                    borderTopWidth: 1,
                    height: 80,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
                tabBarItemStyle: {
                    borderRadius: 12,
                    marginHorizontal: 4,
                    overflow: 'hidden',
                },
                tabBarActiveBackgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                tabBarInactiveBackgroundColor: isDark ? '#000000' : '#FFFFFF',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Spots',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="prompts"
                options={{
                    title: 'Prompts',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="groups"
                options={{
                    title: 'Groups',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
                    ),
                }}
            />
            
            <Tabs.Screen
                name="edit-profile"
                options={{
                    href: null, 
                }}
            />
            <Tabs.Screen
                name="account-settings"
                options={{
                    href: null, 
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    href: null, 
                }}
            />
            <Tabs.Screen
                name="privacy"
                options={{
                    href: null, 
                }}
            />
            <Tabs.Screen
                name="how-it-works"
                options={{
                    href: null, 
                }}
            />
        </Tabs>
    );
}