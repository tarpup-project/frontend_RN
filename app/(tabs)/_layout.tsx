import { Tabs } from 'expo-router';
import { useTheme } from "@/app/contexts/ThemeContext";
import { Home, Activity, Users, User } from 'lucide-react-native';

export default function TabLayout() {
    const { isDark } = useTheme();
        
    return (
        <Tabs
            key={isDark ? 'dark' : 'light'} 
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
                        <Home 
                            size={24} 
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
                            size={24} 
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
                            size={24} 
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
                            size={24} 
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