export interface GroupMember {
  fname: string;
  id: string;
  bgUrl?: string;
}

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

export interface LastMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    fname: string;
    lname?: string;
  };
}

export interface Group {
  id: string;
  name: string;
  description: string;
  score: number;
  unread: number;
  shareLink?: string;
  isComplete: boolean;
  isJoined?: boolean;
  isAdmin?: boolean;
  category: Category[];
  members: GroupMember[];
  messages: LastMessage[];
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}


export enum MessageType {
  USER = 'user',
  ALERT = 'alert'
}

export interface MessageSender {
  id: string;
  fname: string;
  bgUrl?: string;
}

export interface MessageContent {
  id: string;
  message: string;
}

export interface MessageFile {
  name: string;
  size: number;
  data: string;
  ext: string;
}

export interface BaseMessage {
  messageType: MessageType;
  content: MessageContent;
  createdAt?: string;
  isPending?: boolean;
  isSynced?: boolean;
}

export interface UserMessage extends BaseMessage {
  messageType: MessageType.USER;
  sender: MessageSender;
  file?: MessageFile;
  replyingTo?: UserMessage;
}

export interface AlertMessage extends BaseMessage {
  messageType: MessageType.ALERT;
  sender: MessageSender;
}

export type GroupMessage = UserMessage | AlertMessage;


export interface SendMessagePayload {
  roomID: string;
  messageType: MessageType;
  content: MessageContent;
  file?: MessageFile;
  sender: {
    id: string;
    fname: string;
  };
  replyingTo?: string | UserMessage;
  createdAt?: string;
}

export interface JoinRoomPayload {
  roomID: string;
  userID: string;
}

export interface GroupsResponse {
  data: Group[];
}

export interface GroupDetailsResponse {
  data: Group;
}

export interface MessagesResponse {
  messages: GroupMessage[];
}