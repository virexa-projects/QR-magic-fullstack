/// <reference path="./types/express.d.ts" />
import "tsconfig-paths/register";
import http from "http";
import { createApp } from "./app";
import { env } from "@config/env";
import { logger } from "@config/logger";
import { connectDatabase, disconnectDatabase } from "@config/database";
import { connectRedis, redisClient } from "@config/redis";
import { initSocket } from "@sockets/index";
import { startCronJobs } from "@jobs/cron";

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  const app = createApp();
  const httpServer = http.createServer(app);

  await initSocket(httpServer);
  startCronJobs();

  httpServer.listen(env.PORT, () => {
    logger.info(`Worker ${process.pid} listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    httpServer.close(async () => {
      await disconnectDatabase();
      if (redisClient.isOpen) await redisClient.quit();
      process.exit(0);
    });
    // Force exit if graceful shutdown hangs
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
  });
  process.on("uncaughtException", (err) => {
    logger.error(`Uncaught Exception: ${err.stack || err}`);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});