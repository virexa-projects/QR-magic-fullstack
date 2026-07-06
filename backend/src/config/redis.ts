import { createClient, RedisClientType } from "redis";
import { env } from "@config/env";
import { logger } from "@config/logger";

export const redisClient: RedisClientType = createClient({ url: env.REDIS_URL });

redisClient.on("error", (err) => logger.error(`Redis error: ${err}`));
redisClient.on("connect", () => logger.info("Redis connected"));
redisClient.on("reconnecting", () => logger.warn("Redis reconnecting..."));

export async function connectRedis(): Promise<void> {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

/**
 * Small helper cache wrapper (get-or-set pattern).
 * Used to reduce MongoDB load for hot-path reads (dashboard summary, QR redirects).
 */
export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch (err) {
    logger.warn(`Cache read failed for ${key}: ${err}`);
  }

  const fresh = await fetcher();

  try {
    await redisClient.set(key, JSON.stringify(fresh), { EX: ttlSeconds });
  } catch (err) {
    logger.warn(`Cache write failed for ${key}: ${err}`);
  }

  return fresh;
}

export async function cacheInvalidate(keyOrPrefix: string, isPrefix = false): Promise<void> {
  try {
    if (!isPrefix) {
      await redisClient.del(keyOrPrefix);
      return;
    }
    const keys: string[] = [];
    for await (const key of redisClient.scanIterator({ MATCH: `${keyOrPrefix}*`, COUNT: 100 })) {
      keys.push(key as unknown as string);
    }
    if (keys.length) await redisClient.del(keys);
  } catch (err) {
    logger.warn(`Cache invalidate failed for ${keyOrPrefix}: ${err}`);
  }
}
