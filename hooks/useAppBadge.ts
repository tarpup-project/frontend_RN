import * as Notifications from 'expo-notifications';
import { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { useUnifiedGroups } from './useUnifiedGroups';

/**
 * Hook to manage the application icon badge count.
 * syncs the badge count with the total number of unread messages across all groups.
 */
export function useAppBadge() {
    const { uiGroups } = useUnifiedGroups();

    // Calculate total unread count
    const unreadTotal = useMemo(() => {
        return (uiGroups || []).reduce((sum: number, g: any) => sum + (Number(g.unreadCount || 0)), 0);
    }, [uiGroups]);

    useEffect(() => {
        const updateBadge = async () => {
            try {
                console.log(`🔴 Syncing app badge to unread count: ${unreadTotal}`);
                await Notifications.setBadgeCountAsync(unreadTotal);
            } catch (error) {
                console.error('Failed to set app badge:', error);
            }
        };

        updateBadge();

        // Also sync when app comes to foreground to ensure consistency
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                updateBadge();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [unreadTotal]);
}
