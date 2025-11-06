import { Tabs } from 'expo-router';
import { useAuthStore } from "@/state/authStore"; 
import { useTheme } from "@/app/contexts/ThemeContext";
import { Home, Activity, Users, User, Lock } from 'lucide-react-native';

export default function TabLayout() {
    const { isDark } = useTheme();
    const { isAuthenticated } = useAuthStore(); 
        
    return (
        <Tabs
            key={isDark ? 'dark' : 'light'} 
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: isDark ? '#FFFFFF' : '#000000',
                tabBarInactiveTintColor: isDark ? '#666666' : '#999999',
                tabBarStyle: {
                    backgroundColor: isDark ? '#0a0a0a' : '#FFFFFF',
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
                tabBarInactiveBackgroundColor: isDark ? '#0a0a0a' : '#FFFFFF',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Spot',
                    tabBarIcon: ({ color, focused }) => (
                        <Home 
                            size={18} 
                            color={color} 
                            strokeWidth={focused ? 2.5 : 2}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="prompts"
                options={{
                    title: 'Prompts',
                    tabBarIcon: ({ color, focused }) => (
                        <Activity 
                            size={18} 
                            color={color} 
                            strokeWidth={focused ? 2.5 : 2}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="groups"
                options={{
                    title: 'Groups',
                    tabBarIcon: ({ color, focused }) => (
                        <Users 
                            size={18} 
                            color={color} 
                            strokeWidth={focused ? 2.5 : 2}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <User 
                            size={18} 
                            color={color} 
                            strokeWidth={focused ? 2.5 : 2}
                        />
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

