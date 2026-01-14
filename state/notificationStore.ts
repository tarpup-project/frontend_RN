import { create } from 'zustand';

interface NotificationState {
  groupNotifications: number;
  personalNotifications: number;
  chatNotifications: number;
  followerNotifications: number;
  friendPostsNotifications: number;
  postLikesNotifications: number;
  commentsNotifications: number;
  pendingMatchesNotifications: number;
  initialized: boolean;
  activeGroupId?: string | null;
  
  setNotifications: (notifications: {
    groupNotifications?: number;
    personalNotifications?: number;
    chatNotifications?: number;
    followerNotifications?: number;
    friendPostsNotifications?: number;
    postLikesNotifications?: number;
    commentsNotifications?: number;
    pendingMatchesNotifications?: number;
  }) => void;
  
  setLists: (lists: {
    // Removed all lists
  }) => void;
  
  markInitialized: () => void;
  setActiveGroupId: (groupId: string | null) => void;
  
  clearNotifications: (type?: 'group' | 'personal' | 'chat' | 'follower' | 'friendPosts' | 'postLikes' | 'comments' | 'pendingMatches') => void;
  
  incrementNotification: (type: 'group' | 'personal' | 'chat' | 'follower' | 'friendPosts' | 'postLikes' | 'comments' | 'pendingMatches') => void;
  
  decrementNotification: (type: 'group' | 'personal' | 'chat' | 'follower' | 'friendPosts' | 'postLikes' | 'comments' | 'pendingMatches') => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  groupNotifications: 0,
  personalNotifications: 0,
  chatNotifications: 0,
  followerNotifications: 0,
  friendPostsNotifications: 0,
  postLikesNotifications: 0,
  commentsNotifications: 0,
  pendingMatchesNotifications: 0,
  initialized: false,
  activeGroupId: null,

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
  
  setActiveGroupId: (groupId) => {
    set({ activeGroupId: groupId });
  },

  clearNotifications: (type) => {
    if (!type) {
      set({
        groupNotifications: 0,
        personalNotifications: 0,
        chatNotifications: 0,
        followerNotifications: 0,
        friendPostsNotifications: 0,
        postLikesNotifications: 0,
        commentsNotifications: 0,
        pendingMatchesNotifications: 0,
        initialized: false,
        activeGroupId: null,
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
