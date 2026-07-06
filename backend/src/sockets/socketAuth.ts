import { Socket } from "socket.io";
import { verifyAccessToken } from "@utils/jwt";
import { User } from "@models/User.model";
import { UserRole } from "@app-types/enums";

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    role: UserRole;
  };
}

function extractToken(socket: Socket): string | null {
  const authToken = socket.handshake.auth?.token as string | undefined;
  if (authToken) return authToken;

  const header = socket.handshake.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);

  const cookieHeader = socket.handshake.headers.cookie;
  if (cookieHeader) {
    const match = /accessToken=([^;]+)/.exec(cookieHeader);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    const token = extractToken(socket);
    if (!token) return next(new Error("Authentication required"));

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.id).select("_id role isActive").lean();
    if (!user || !user.isActive) return next(new Error("Account not found or deactivated"));

    (socket as AuthenticatedSocket).data.userId = user._id.toString();
    (socket as AuthenticatedSocket).data.role = user.role;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
}
