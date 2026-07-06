import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { env } from "@config/env";
import { logger } from "@config/logger";
import { socketAuthMiddleware, AuthenticatedSocket } from "./socketAuth";
import { setIO } from "./io";
import { UserRole } from "@app-types/enums";

export async function initSocket(httpServer: HttpServer): Promise<Server> {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    // Keeps connections stable for mobile clients on flaky networks - important at 1000+ concurrent users
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ["websocket", "polling"],
  });

  // Redis adapter lets scan events fan out correctly across every clustered Node process,
  // not just the process that happened to receive the HTTP redirect hit.
  const pubClient = createClient({ url: env.REDIS_URL });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const { userId, role } = authSocket.data;

    // Personal room: dashboard clients receive their own live scan events here
    socket.join(`user:${userId}`);
    if (role === UserRole.ADMIN || role === UserRole.SUPERADMIN) {
      socket.join("admins");
    }

    logger.debug(`Socket connected: user=${userId} socket=${socket.id}`);

    socket.on("qr:watch", (qrId: string) => {
      socket.join(`qr:${qrId}`);
    });

    socket.on("qr:unwatch", (qrId: string) => {
      socket.leave(`qr:${qrId}`);
    });

    socket.on("disconnect", (reason) => {
      logger.debug(`Socket disconnected: user=${userId} reason=${reason}`);
    });
  });

  setIO(io);
  return io;
}
