import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ReadReceiptsState {
    lastReadTimestamps: Record<string, number>;
    markGroupAsRead: (groupId: string) => void;
    getLastRead: (groupId: string) => number;
    // For debugging/reset
    clearAll: () => void;
}

export const useReadReceiptsStore = create<ReadReceiptsState>()(
    persist(
        (set, get) => ({
            lastReadTimestamps: {},

            markGroupAsRead: (groupId: string) => {
                set((state) => ({
                    lastReadTimestamps: {
                        ...state.lastReadTimestamps,
                        [groupId]: Date.now(),
                    },
                }));
            },

            getLastRead: (groupId: string) => {
                const { lastReadTimestamps } = get();
                return lastReadTimestamps[groupId] || 0;
            },

            clearAll: () => {
                set({ lastReadTimestamps: {} });
            },
        }),
        {
            name: 'read-receipts-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
