import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import morgan from "morgan";
import { env } from "@config/env";
import { logger } from "@config/logger";
import { requestId } from "@middlewares/requestId.middleware";
import { globalRateLimiter } from "@middlewares/rateLimiter.middleware";
import { notFoundHandler, errorHandler } from "@middlewares/errorHandler.middleware";
import apiRouter from "@routes/index";
import redirectRouter from "@routes/redirect.routes";

export function createApp(): Application {
  const app = express();
// Correct (what fixed the earlier IP-detection bug):
app.set("trust proxy", "loopback, linklocal, uniquelocal");

// Reverted (brings back the wrong-IP bug):
app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(hpp());
  app.use(requestId);

  app.use(
    morgan(env.isProd ? "combined" : "dev", {
      stream: { write: (msg: string) => logger.http?.(msg.trim()) ?? logger.info(msg.trim()) },
    })
  );

  app.use(globalRateLimiter);

  // Public short-link redirect (scan endpoint) — mounted at root, not under /api
  app.use("/r", redirectRouter);

  app.use("/api/v1", apiRouter);
  app.use('/uploads', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  next();
}, express.static('uploads'));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
