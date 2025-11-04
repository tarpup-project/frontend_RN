// Socket Types and Event Definitions for Mobile App

import { Socket } from 'socket.io-client';
import { GroupMessage, SendMessagePayload, JoinRoomPayload, MessagesResponse } from './groups';

export interface SocketInterface {
  socket?: Socket;
}

export enum SocketEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  
  JOIN_GROUP_ROOM = 'joinGroupRoom',
  LEAVE_GROUP_ROOM = 'leaveGroupRoom',
  GROUP_ROOM_MESSAGE = 'groupRoomMessage',
  
  JOIN_PERSONAL_ROOM = 'joinPersonalRoom',
  PERSONAL_MESSAGE = 'personalMessage',
}


export interface SocketEventMap {

  [SocketEvents.JOIN_GROUP_ROOM]: JoinRoomPayload;
  [SocketEvents.GROUP_ROOM_MESSAGE]: SendMessagePayload;
  [SocketEvents.JOIN_PERSONAL_ROOM]: { roomID: string };
  
  [SocketEvents.CONNECT]: void;
  [SocketEvents.DISCONNECT]: void;
  [SocketEvents.ERROR]: { message: string };
}

export interface JoinRoomResponse {
  messages: GroupMessage[];
}

export interface MessageResponse {
  status: 'ok' | 'error';
  message?: string;
}


export interface SocketState {
  connected: boolean;
  error?: string;
  reconnecting: boolean;
}


export interface SocketContextType {
  socket?: Socket;
  state: SocketState;
  connect: () => void;
  disconnect: () => void;
}