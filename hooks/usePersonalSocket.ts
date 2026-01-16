import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { UrlConstants } from "../constants/apiUrls";
import { useAuthStore } from "../state/authStore";
import { useNotificationStore } from "../state/notificationStore";

interface UsePersonalSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
}

export const usePersonalSocket = (): UsePersonalSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();
  const { incrementNotification } = useNotificationStore();
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);
  const connectAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const newSocket = io(`${UrlConstants.baseUrl}/groups`, {
      transports: ["websocket"],
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      connectAtRef.current = Date.now();
      console.log("✅ Personal socket connected");
      console.log("📤 Emitting joinPersonalRoom:", { roomID: user.id });
      setIsConnected(true);
      newSocket.emit("joinPersonalRoom", { roomID: user.id });
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("connect_error", () => {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        newSocket.connect();
      }, 3000) as unknown as number;
    });

    // Listen for personal messages to update badges
    newSocket.on("personalMessage", (data: any) => {
      // Don't count own messages
      if (data.senderId === user.id) return;
      
      console.log('🔔 New personal message received via socket, updating badge');
      incrementNotification('personal');
      if (connectAtRef.current) {
        const latency = Date.now() - connectAtRef.current;
        console.log(`⏱️ Personal DM latency since connect: ${latency}ms`);
      }
    });

    newSocket.on("messagePersonalRoom", () => {
      if (connectAtRef.current) {
        const latency = Date.now() - connectAtRef.current;
        console.log(`⏱️ Personal DM latency since connect: ${latency}ms`);
      }
    });

    setSocket(newSocket);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      connectAtRef.current = null;
      newSocket.disconnect();
    };
  }, [user?.id]);

  return { socket, isConnected };
};
