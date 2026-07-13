import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Returns a singleton socket connection, authenticated via the httpOnly
 * "accessToken" cookie (withCredentials: true). If your auth instead lives
 * in a JS-readable token, pass it as `auth: { token }` here instead.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: false,
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}