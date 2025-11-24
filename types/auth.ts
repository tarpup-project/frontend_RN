
export interface AuthUserInterface {
    id: string;
    fname: string;
    lname?: string;
    email: string;
    bgUrl?: string;
    isStudent: boolean;
    profileVerified: boolean;
    phoneNumber: string;
    major?: string;
    bio?: string;
    year?: string;
    refferals: number;
    interests: string[];
    prefs: { category: string; isPref: boolean }[];
    emailVerified: boolean;
    authToken?: string;
    universityID?: string;
    stateID?: string;
    createdAt: string;
  }
  
  export interface CategoryPrefs {
    category: string;
    isPref: boolean;
  }
  
  export interface UserNotificationSetting {
    emailVisibile: boolean;
    profileVisibile: boolean;
    dataSharing: boolean;
    emailNotification: boolean;
    weeklyDigest: boolean;
    importantUpdates: boolean;
    newFeature: boolean;
    categoryPref: CategoryPrefs[];
  }
  
  export interface FetchUserProfile {
    userDetails: {
      id: string;
      bio?: string;
      bgUrl?: string;
      fname: string;
      lname?: string;
      university?: {
        id: string;
        name: string;
      };
      createdAt: string;
    };
    stats: {
      totalMatches: number;
      totalGroups: number;
      avgComp: number;
      interests: string[];
    };
  }
  

  export interface LoginRequest {
    email: string;
  }
  
  export interface LoginResponse {
    message: string;
    success: boolean;
  }
  
  export interface VerifyOTPRequest {
    email: string;
    otp: string;
  }
  
  export interface VerifyOTPResponse {
    user: AuthUserInterface;
    token: string;
    message: string;
    success: boolean;
  }
  
  export interface ResendOTPRequest {
    email: string;
  }
  
  export interface FetchAuthUserResponse {
    user: AuthUserInterface;
    success: boolean;
  }
  

  export interface SignupRequest {
    email: string;
    fullName: string;
    universityID?: string;
    stateID?: string;
    referrerID?: string;
  }
  
  export interface SignupResponse {
    message: string;
    success: boolean;
  }
  
  export interface University {
    id: string;
    name: string;
    city: string;
    state: string;
    country: string;
    createdAt?: string;
  }