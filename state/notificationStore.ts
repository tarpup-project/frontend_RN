import { create } from 'zustand';

interface NotificationState {
  groupNotifications: number;
  personalNotifications: number;
  chatNotifications: number;
  followerNotifications: number;
  postLikesNotifications: number;
  friendPostsNotifications: number;
  commentsNotifications: number;
  initialized: boolean;
  followersList: any[];
  postLikesList: any[];
  friendPostsList: any[];
  commentsList: any[];
  friendRequestsList: any[];
  pendingMatchesList: any[];
  
  setNotifications: (notifications: {
    groupNotifications?: number;
    personalNotifications?: number;
    chatNotifications?: number;
    followerNotifications?: number;
    postLikesNotifications?: number;
    friendPostsNotifications?: number;
    commentsNotifications?: number;
  }) => void;
  
  setLists: (lists: {
    followersList?: any[];
    postLikesList?: any[];
    friendPostsList?: any[];
    commentsList?: any[];
    friendRequestsList?: any[];
    pendingMatchesList?: any[];
  }) => void;
  
  markInitialized: () => void;
  
  clearNotifications: (type?: 'group' | 'personal' | 'chat' | 'follower' | 'postLikes' | 'friendPosts' | 'comments') => void;
  
  incrementNotification: (type: 'group' | 'personal' | 'chat' | 'follower' | 'postLikes' | 'friendPosts' | 'comments') => void;
  
  decrementNotification: (type: 'group' | 'personal' | 'chat' | 'follower' | 'postLikes' | 'friendPosts' | 'comments') => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  groupNotifications: 0,
  personalNotifications: 0,
  chatNotifications: 0,
  followerNotifications: 0,
  postLikesNotifications: 0,
  friendPostsNotifications: 0,
  commentsNotifications: 0,
  initialized: false,
  followersList: [],
  postLikesList: [],
  friendPostsList: [],
  commentsList: [],
  friendRequestsList: [],
  pendingMatchesList: [],

  setNotifications: (notifications) => {
    set((state) => ({
      ...state,
      ...notifications,
    }));
  },
  
  setLists: (lists) => {
    set((state) => ({
      ...state,
      ...lists,
    }));
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
        followerNotifications: 0,
        postLikesNotifications: 0,
        friendPostsNotifications: 0,
        commentsNotifications: 0,
        followersList: [],
        postLikesList: [],
        friendPostsList: [],
        commentsList: [],
        friendRequestsList: [],
        pendingMatchesList: [],
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
