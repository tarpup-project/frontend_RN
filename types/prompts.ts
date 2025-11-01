// Category Types
export interface Category {
    id: string;
    icon: string;
    name: string;
    matches: number;
    shortDesc: string;
    colorHex: string;
    bgColorHex: string;
    createdAt: string;
  }
  
  // Request/Prompt Types
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
  
  // Submit Request Types
  export interface SubmitRequestPayload {
    requestID: string;
  }
  
  export interface SubmitRequestResponse {
    success: boolean;
    message: string;
  }
  
  // Filter Types
  export interface FilterType {
    index: number;
    id?: string;
  }