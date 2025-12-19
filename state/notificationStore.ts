import { create } from 'zustand';

interface NotificationState {
  groupNotifications: number;
  personalNotifications: number;
  chatNotifications: number;
  groupUnreadById: Record<string, number>;
  
  setNotifications: (notifications: {
    groupNotifications?: number;
    personalNotifications?: number;
    chatNotifications?: number;
  }) => void;
  
  clearNotifications: (type?: 'group' | 'personal' | 'chat') => void;
  
  incrementNotification: (type: 'group' | 'personal' | 'chat') => void;
  
  decrementNotification: (type: 'group' | 'personal' | 'chat') => void;
  
  incrementGroupUnread: (groupId: string, amount?: number) => void;
  clearGroupUnread: (groupId?: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  groupNotifications: 0,
  personalNotifications: 0,
  chatNotifications: 0,
  groupUnreadById: {},

  setNotifications: (notifications) => {
    set((state) => ({
      ...state,
      ...notifications,
    }));
  },

  clearNotifications: (type) => {
    if (!type) {
      set({
        groupNotifications: 0,
        personalNotifications: 0,
        chatNotifications: 0,
        groupUnreadById: {},
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
  
  incrementGroupUnread: (groupId, amount = 1) => {
    set((state) => {
      const nextCount = (state.groupUnreadById[groupId] || 0) + amount;
      const nextMap = { ...state.groupUnreadById, [groupId]: nextCount };
      const total = Object.values(nextMap).reduce((sum, n) => sum + n, 0);
      return {
        ...state,
        groupUnreadById: nextMap,
        groupNotifications: total,
      };
    });
  },
  
  clearGroupUnread: (groupId) => {
    set((state) => {
      if (!groupId) {
        return { 
          ...state, 
          groupUnreadById: {}, 
          groupNotifications: 0 
        };
      }
      const nextMap = { ...state.groupUnreadById };
      delete nextMap[groupId];
      const total = Object.values(nextMap).reduce((sum, n) => sum + n, 0);
      return {
        ...state,
        groupUnreadById: nextMap,
        groupNotifications: total,
      };
    });
  },
}));
