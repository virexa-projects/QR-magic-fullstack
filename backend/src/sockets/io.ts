import { Server } from "socket.io";

let ioInstance: Server | null = null;

export function setIO(io: Server): void {
  ioInstance = io;
}

export function getIO(): Server {
  if (!ioInstance) throw new Error("Socket.IO has not been initialized yet");
  return ioInstance;
}

// Every user has a private room "user:<id>" (joined in your socket.ts
// connection handler). Notification.service.ts emits into this room —
// exporting the naming here keeps both files in sync.
export function userRoom(userId: string): string {
  return `user:${userId}`;
}