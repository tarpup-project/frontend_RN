class UrlConstants {
    static readonly baseUrl = 'https://server.tarpup.com';
  
    // User Routes - Authentication
    static createUser = `/user/create`;
    static loginUser = `/user/login`;
    static verifyOTP = `/user/verify`;
    static resendVerifyOTP = `/user/resend-otp`;
    static refreshToken = `/user/refresh`;
    static logout = `/user/logout`;
    static fetchAuthUser = `/user/auth`;
  
    // User Routes - Profile
    static validateProfile = `/user/profile/validate`;
    static fetchUserProfile = (id: string) => `/user/profile-view/${id}`;
    static verifyProfile = `/user/profile/verify`;
    static editProfile = `/user/edit`;
    static deleteAccount = '/user/delete';
  
    // User Routes - Data
    static fetchAllUniversities = `/user/universities`;
    static fetchAllStates = `/user/states`;
    static activityStats = `/user/stats`;
  
    // User Routes - Notifications
    static allNotifications = `/user/notifications`;
    static notificationSettings = '/user/profile/notification';
  
    // User Routes - Messages (Personal AI)
    static fetchPersonalMessageHistory = `/user/messages`;
    static markMessagesAsRead = `/user/messages/mark`;
    static deletePersonalMessages = `/user/messages/delete`;
  
    // User Routes - Prompts
    static activePrompts = `/user/prompts/active`;
    static deleteActivePrompts = (id: string) => `/user/prompts/active/${id}`;
  
    // User Routes - Matches
    static pendingMatches = `/user/matches/pending`;
  
    // Groups Routes
    static fetchAllGroups = (campusID?: string) =>
      `/groups/all${campusID ? `?campusID=${campusID}` : ''}`;
    static fetchAllCategories = (campusID?: string, stateID?: string) =>
      `/groups/categories${campusID !== undefined ? `?campusID=${campusID}` : ''}${
        stateID !== undefined ? `?stateID=${stateID}` : ''
      }`;
    static markGroupMessageAsRead = (groupID: string) => `/groups/mark/${groupID}`;
    static leaveGroup = `/groups/leave`;
    static fetchGroupDetails = (groupID: string) => `/activities/groups/details/${groupID}`;
    static fetchInviteGroupDetails = (groupID: string) => `/groups/details/${groupID}`;
  
    // Activities/Spots Routes
    static fetchAllCatgories = `/activities/categories`;
    static submitRequest = `/activities/requests`;
    static fetchRequestDetails = (id: string) => `/activities/requests/details/${id}`;
    static fetchMatchDetails = (matchID: string) => `/activities/matches/details/${matchID}`;
    static fetchAllMatches = (campusID?: string, stateID?: string) =>
      `/activities/matches?b=null${campusID !== undefined ? `&campusID=${campusID}` : ''}${
        stateID !== undefined ? `&stateID=${stateID}` : ''
      }`;
    static fetchAllRequests = (
      campusID?: string,
      stateID?: string,
      filterID?: string,
      userID?: string
    ) =>
      `/activities/requests?b=null${campusID !== undefined ? `&campusID=${campusID}` : ''}${
        stateID !== undefined ? `&stateID=${stateID}` : ''
      }${filterID ? `&categoryID=${filterID}` : ''}${userID ? `&userID=${userID}` : ''}`;
    static fetchCategoryMatches = (categoryID: string, campusID: string) =>
      `/activities/matches/category/${categoryID}/${campusID}`;
  
    // WebSocket Routes
    static groupsRoute = `${this.baseUrl}/groups`;
  }
  
  export { UrlConstants };