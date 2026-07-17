import mongoose from "mongoose";
import { env } from "@config/env";
import { logger } from "@config/logger";

mongoose.set("strictQuery", true);

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    logger.error(`MongoDB connection error: ${err}`);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected. Attempting reconnect...");
  });

 await mongoose.connect(
  env.MONGO_URI || "mongodb://mongodb:27017/qrbharat",
  {
    maxPoolSize: env.MONGO_POOL_SIZE,
    minPoolSize: 5,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 10000,
    family: 4,
  }
);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
