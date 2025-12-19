class UrlConstants {
  static readonly baseUrl = "https://server.tarpup.com";

  static createUser = `/user/create`;
  static loginUser = `/user/login`;
  static verifyOTP = `/user/verify`;
  static resendVerifyOTP = `/user/resend-otp`;
  static refreshToken = `/user/refresh`;
  static logout = `/user/logout`;
  static fetchAuthUser = `/user/auth`;

  static validateProfile = `/user/profile/validate`;
  static fetchUserProfile = (id: string) => `/user/profile-view/${id}`;
  static verifyProfile = `/user/profile/verify`;
  static editProfile = `/user/edit`;
  static deleteAccount = "/user/delete";

  static fetchAllUniversities = `/user/universities`;
  static fetchAllStates = `/user/states`;
  static activityStats = `/user/stats`;

  static getUserLeaderboard = (id: string) => `/analytics/user/${id}`;

  static allNotifications = `/user/notifications`;
  static notificationSettings = "/user/profile/notification";
  static sendUserNotification = "/user/notifications/user";
  static sendTopicNotification = "/user/notifications/topic";

  static fetchPersonalMessageHistory = `/user/messages`;
  static markMessagesAsRead = `/user/messages/mark`;
  static deletePersonalMessages = `/user/messages/delete`;

  static activePrompts = `/user/prompts/active`;
  static deleteActivePrompts = (id: string) => `/user/prompts/active/${id}`;

  static pendingMatches = `/user/matches/pending`;

  static fetchAllGroups = (campusID?: string) =>
    `/groups/all${campusID ? `?campusID=${campusID}` : ""}`;
  static uploadImageToMessage = (id: string) => `/user/messages/upload/${id}`
  static fetchAllCategories = (campusID?: string, stateID?: string) =>
    `/groups/categories${
      campusID !== undefined ? `?campusID=${campusID}` : ""
    }${stateID !== undefined ? `?stateID=${stateID}` : ""}`;
  static markGroupMessageAsRead = (groupID: string) =>
    `/groups/mark/${groupID}`;
  static leaveGroup = `/groups/leave`;
  static fetchGroupDetails = (groupID: string) =>
    `/activities/groups/details/${groupID}`;
  static markGroupAsCompleted = `/groups/complete`;
  static reportGroup = `/groups/report`;
  static fetchInviteGroupDetails = (groupID: string) =>
    `/groups/details/${groupID}`;

  static fetchAllCatgories = `/activities/categories`;
  static submitRequest = `/activities/requests`;
  static fetchRequestDetails = (id: string) =>
    `/activities/requests/details/${id}`;
  static fetchMatchDetails = (matchID: string) =>
    `/activities/matches/details/${matchID}`;
  static fetchAllMatches = (campusID?: string, stateID?: string) =>
    `/activities/matches?b=null${
      campusID !== undefined ? `&campusID=${campusID}` : ""
    }${stateID !== undefined ? `&stateID=${stateID}` : ""}`;
  static fetchAllRequests = (
    campusID?: string,
    stateID?: string,
    filterID?: string,
    userID?: string
  ) =>
    `/activities/requests?b=null${
      campusID !== undefined ? `&campusID=${campusID}` : ""
    }${stateID !== undefined ? `&stateID=${stateID}` : ""}${
      filterID ? `&categoryID=${filterID}` : ""
    }${userID ? `&userID=${userID}` : ""}`;
  static fetchCategoryMatches = (categoryID: string, campusID: string) =>
    `/activities/matches/category/${categoryID}/${campusID}`;

  // Tarps
  static uploadTarps = `/tarps/upload`;
  static fetchPeopleMessage = (userID: string) => `/tarps/people/message/${userID}`;
  static fetchPeopleMessages = (userID: string) => `/tarps/people/message/${userID}`;
  static tarpNavigateToUser = (params: { locationID: string; startingLat?: number; startingLng?: number; startingLocation?: string }) => {
    const q = new URLSearchParams({
      locationID: params.locationID,
      ...(params.startingLat !== undefined ? { startingLat: String(params.startingLat) } : {}),
      ...(params.startingLng !== undefined ? { startingLng: String(params.startingLng) } : {}),
      ...(params.startingLocation ? { startingLocation: params.startingLocation } : {}),
    });
    return `/tarps/people/navigate?${q.toString()}`;
  };
  static tarpLikePost = `/tarps/posts/like`;
  static tarpPostComments = (postImageID: string) => `/tarps/posts/${postImageID}/comments`;
  static tarpToggleFriend = `/tarps/user/friend`;
  static tarpToggleFollow = `/tarps/user/follow`;

  static groupsRoute = `${this.baseUrl}/groups`;
}

export { UrlConstants };
