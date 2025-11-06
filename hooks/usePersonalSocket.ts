import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { UrlConstants } from "../constants/apiUrls";
import { useAuthStore } from "../state/authStore";

interface UsePersonalSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
}

export const usePersonalSocket = (): UsePersonalSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!user?.id) return;

    const newSocket = io(`${UrlConstants.baseUrl}/groups`, {
      transports: ["websocket"],
      autoConnect: true,
    });

    newSocket.on("connect", () => {
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

    setSocket(newSocket);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      newSocket.disconnect();
    };
  }, [user?.id]);

  return { socket, isConnected };
};
