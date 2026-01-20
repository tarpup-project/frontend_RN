import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState } from 'react-native';

/**
 * Hook to manage the application icon badge count.
 * syncs the badge count with the total number of unread messages across all groups.
 */
export function useAppBadge() {
    useEffect(() => {
        // Only run on iOS for now

        const resetBadge = async () => {
            try {
                // When user opens the app, we reset the notification-based badge count
                // logically assuming they are now "handling" the notifications.
                // If the user wants persistent unread counts on badge even after opening,
                // that conflicts with "count push notifications". 
                // Push notification badges usually clear when you open the app (e.g. WhatsApp, Messages behavior).

                await Notifications.setBadgeCountAsync(0);
                console.log('0️⃣ App badge reset to 0 on foreground');
            } catch (error) {
                console.error('Failed to reset app badge:', error);
            }
        };

        resetBadge();

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                resetBadge();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []); // Run once and on mount/foreground, no dependency on groups anymore
}
