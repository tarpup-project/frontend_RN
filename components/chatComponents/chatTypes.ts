
export interface FileData {
    data: string;
    name: string;
    ext?: string;
    size: number;
  }
  
  export interface ReplyData {
    sender: {
      fname: string;
      id?: string;
    };
    content: {
      message: string;
      id?: string;
    };
    file?: FileData;
  }
  
  export interface MessageData {
    id: string;
    sender: string;
    text: string;
    time: string;
    isMe: boolean;
    isAlert?: boolean;
    avatar: string;
    file?: FileData;
    replyingTo?: ReplyData;
    rawMessage?: any;
  }
  
  export interface GroupDetailsData {
    id: string;
    name: string;
    members: Array<{
      id: string;
      fname: string;
      bgUrl?: string;
    }>;
    score: number;
    shareLink: string;
    isJoined: boolean;
    isAdmin: boolean;
    isComplete: boolean;
    category?: Array<{
      name: string;
      bgColorHex: string;
    }>;
  }