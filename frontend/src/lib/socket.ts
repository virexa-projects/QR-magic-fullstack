import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // If NEXT_PUBLIC_SOCKET_URL is unset/empty, omit the URL entirely so
    // socket.io-client connects to the same origin the page was loaded
    // from (works correctly behind nginx/ngrok without hardcoding a host).
    // Only pass an explicit URL if one was actually provided at build time.
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

    socket = socketUrl
      ? io(socketUrl, {
          withCredentials: true,
          transports: ["polling", "websocket"],
          autoConnect: false,
        })
      : io({
          withCredentials: true,
          transports: ["polling", "websocket"],
          autoConnect: false,
        });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}