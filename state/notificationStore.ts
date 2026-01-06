import { create } from 'zustand';

interface NotificationState {
  groupNotifications: number;
  personalNotifications: number;
  chatNotifications: number;
  initialized: boolean;
  
  setNotifications: (notifications: {
    groupNotifications?: number;
    personalNotifications?: number;
    chatNotifications?: number;
  }) => void;
  
  setLists: (lists: {
    // Removed all lists
  }) => void;
  
  markInitialized: () => void;
  
  clearNotifications: (type?: 'group' | 'personal' | 'chat') => void;
  
  incrementNotification: (type: 'group' | 'personal' | 'chat') => void;
  
  decrementNotification: (type: 'group' | 'personal' | 'chat') => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  groupNotifications: 0,
  personalNotifications: 0,
  chatNotifications: 0,
  initialized: false,

  setNotifications: (notifications) => {
    set((state) => ({
      ...state,
      ...notifications,
    }));
  },
  
  setLists: (lists) => {
    // No lists to set anymore
  },
  
  markInitialized: () => {
    set({ initialized: true });
  },

  clearNotifications: (type) => {
    if (!type) {
      set({
        groupNotifications: 0,
        personalNotifications: 0,
        chatNotifications: 0,
        initialized: false,
      });
    } else {
      set((state) => ({
        ...state,
        [`${type}Notifications`]: 0,
      }));
    }
  },

  incrementNotification: (type) => {
    set((state) => ({
      ...state,
      [`${type}Notifications`]: state[`${type}Notifications`] + 1,
    }));
  },

  decrementNotification: (type) => {
    set((state) => ({
      ...state,
      [`${type}Notifications`]: Math.max(0, state[`${type}Notifications`] - 1),
    }));
  },
}));
