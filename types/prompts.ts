
  export interface Category {
    id: string;
    icon: string;
    name: string;
    matches: number;
    shortDesc: string;
    bgColor: string;
    subtitle: string;
    bgColorHex?: string;
    iconColor: string;
    colorHex?: string;
    createdAt: string;
  }

  export interface PromptOwner {
    id: string;
    fname: string;
    isStudent: boolean;
    profileVerified: boolean;
  }

  export interface Prompt {
    id: string;
    title: string;
    description: string;
    imageFile?: string;
    startTime: string;
    endTime: string;
    isCompleted: boolean;
    createdAt: string;
    publicGroupID?: string;
    category: Category[];
    owner: PromptOwner;
  }

  export interface AllPromptsResponse {
    requests: Prompt[];
    sentAt: string;
  }


  export interface SubmitRequestPayload {
    requestID: string;
  }

  export interface SubmitRequestResponse {
    success: boolean;
    message: string;
  }


  export interface FilterType {
    index: number;
    id?: string;
  }
