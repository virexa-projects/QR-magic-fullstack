import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { Request, Response, NextFunction } from "express";
import { redisClient } from "@config/redis";
import { env } from "@config/env";

/**
 * Build a RedisStore with the given key prefix.
 * Must only be called AFTER redisClient is connected.
 */
function buildStore(prefix: string): RedisStore {
  return new RedisStore({
    // @ts-ignore - sendCommand typing mismatch between redis v4 and rate-limit-redis
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix,
  });
}

/**
 * Returns a lazily-initialized rate-limit middleware.
 * The RedisStore (and its constructor-time sendCommand call) is deferred
 * until the first request, ensuring Redis is already connected by then.
 */
function makeLazyLimiter(
  options: Omit<Parameters<typeof rateLimit>[0], "store">,
  prefix: string
): (req: Request, res: Response, next: NextFunction) => void {
  let limiter: ReturnType<typeof rateLimit> | null = null;

  return (req: Request, res: Response, next: NextFunction) => {
    if (!limiter) {
      limiter = rateLimit({ ...options, store: buildStore(prefix) });
    }
    return limiter(req, res, next);
  };
}

// Shared limit applied to every route
export const globalRateLimiter = makeLazyLimiter(
  {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." },
  },
  "rl:global:"
);

// Tighter limits for brute-force-sensitive auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

// High-throughput limiter for the public QR redirect/scan endpoint
export const scanRateLimiter = makeLazyLimiter(
  {
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many scans from this source." },
  },
  "rl:scan:"
);