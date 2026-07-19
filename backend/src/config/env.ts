import dotenv from "dotenv";
dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:5000",
  GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID||"",
  CLUSTER_WORKERS: parseInt(process.env.CLUSTER_WORKERS || "0", 10),

  MONGO_URI: required("MONGO_URI", "mongodb://127.0.0.1:27017/qrbharat"),
  MONGO_POOL_SIZE: parseInt(process.env.MONGO_POOL_SIZE || "50", 10),

  REDIS_URL: required("REDIS_URL", "redis://127.0.0.1:6379"),

  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET", "dev_access_secret"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET", "dev_refresh_secret"),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",

  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "localhost",

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "120", 10),
  AUTH_RATE_LIMIT_WINDOW_MS: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || "60000", 10),
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || "120", 10),

  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10),

  SHORT_URL_BASE: process.env.SHORT_URL_BASE || "https://qrb.in",

  // Payment
 

  PAYPAL_WEBHOOK_ID:process.env.PAYPAL_WEBHOOK_ID|| "",
  PAYPAL_CLIENT_ID:process.env.PAYPAL_CLIENT_ID|| "",
  PAYPAL_CLIENT_SECRET:process.env.PAYPAL_CLIENT_SECRET|| "",
  PAYPAL_MODE:process.env.PAYPAL_CLIENT_SECRET|| "sandbox",
  INR_TO_USD_FALLBACK_RATE:process.env.INR_TO_USD_FALLBACK_RATE,

  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",

  isProd: process.env.NODE_ENV === "production",

  CLOUDINARY_CLOUD_NAME:process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY:process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET:process.env.CLOUDINARY_API_SECRET,
};