import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { User, IUser } from "@models/User.model";
import { RefreshToken } from "@models/RefreshToken.model";
import { Plan } from "@models/Plan.model";
import { ApiError } from "@utils/ApiError";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@utils/jwt";
import { redisClient } from "@config/redis";
import { env } from "@config/env";
import { UserRole } from "@app-types/enums";
import * as billingService from "@services/billing.service";
import { sendVerificationEmail } from "@services/email.service";

interface DeviceInfo {
  userAgent?: string;
  ip?: string;
}

// ────────────────────────────── Email verification ──────────────────────────────

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function generateVerificationToken(): { raw: string; hash: string; expires: Date } {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = hashToken(raw);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return { raw, hash, expires };
}

/** Issues a fresh verification token, stores its hash, and emails the link. */
export async function sendEmailVerification(user: IUser) {
  const { raw, hash, expires } = generateVerificationToken();

  user.emailVerificationTokenHash = hash;
  user.emailVerificationExpires = expires;
  await user.save();

  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${raw}&email=${encodeURIComponent(user.email)}`;
  await sendVerificationEmail(user.email, user.name, verifyUrl);
}

export async function verifyEmailToken(email: string, rawToken: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+emailVerificationTokenHash +emailVerificationExpires"
  );
  if (!user) throw ApiError.badRequest("Invalid verification link");
  if (user.isVerified) return user; // idempotent — clicking the link twice is fine

  if (!user.emailVerificationTokenHash || !user.emailVerificationExpires) {
    throw ApiError.badRequest("No pending verification for this account");
  }
  if (user.emailVerificationExpires < new Date()) {
    throw ApiError.badRequest("Verification link has expired. Please request a new one.");
  }

  const incomingHash = hashToken(rawToken);
  if (incomingHash !== user.emailVerificationTokenHash) {
    throw ApiError.badRequest("Invalid verification link");
  }

  user.isVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return user;
}

export async function resendVerificationEmail(email: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw ApiError.notFound("No account found with this email");
  if (user.isVerified) throw ApiError.badRequest("This email is already verified");

  await sendEmailVerification(user);
}

// ────────────────────────────── Tokens / sessions ──────────────────────────────

function refreshExpiryDate(): Date {
  // JWT_REFRESH_EXPIRES_IN is like "30d" - convert to ms manually to avoid extra deps
  const match = /^(\d+)([smhd])$/.exec(env.JWT_REFRESH_EXPIRES_IN);
  const value = match ? parseInt(match[1], 10) : 30;
  const unit = match ? match[2] : "d";
  const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] ?? 86400000;
  return new Date(Date.now() + value * unitMs);
}

export async function issueTokenPair(user: IUser, device: DeviceInfo) {
  const accessToken = signAccessToken({
    id: user._id.toString(),
    role: user.role,
    email: user.email,
    planId: user.currentPlan?.toString(),
  });

  const jti = uuidv4();
  const refreshToken = signRefreshToken({
    id: user._id.toString(),
    tokenVersion: user.tokenVersion,
    jti,
  });

  await RefreshToken.create({
    user: user._id,
    jti,
    userAgent: device.userAgent,
    ip: device.ip,
    expiresAt: refreshExpiryDate(),
  });

  return { accessToken, refreshToken };
}

// ────────────────────────────── Register / login ──────────────────────────────

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}, device: DeviceInfo) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const freePlan = await Plan.findOne({
    slug: "free",
    isActive: true,
  });

  if (!freePlan) {
    throw new Error("Free plan not found");
  }

  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
    phone: input.phone,
    role: UserRole.USER,
    currentPlan: freePlan._id,
  });

  // Automatically activate the Free subscription
  await billingService.subscribeUserToPlan(
    user._id.toString(),
    freePlan._id.toString(),
    {
      paymentGateway: "free",
      paymentId: "free-plan",
      autoRenew: false,
    }
  );

  const tokens = await issueTokenPair(user, device);

  // Fire-and-forget: don't let a mail-provider outage block registration.
  sendEmailVerification(user).catch((err) => {
    console.error("Failed to send verification email:", err);
  });

  return { user, ...tokens };
}

export async function loginUser(email: string, password: string, device: DeviceInfo) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) throw ApiError.unauthorized("Invalid email or password");
  if (!user.isActive) throw ApiError.forbidden("Account has been deactivated");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized("Invalid email or password");

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueTokenPair(user, device);
  return { user, ...tokens };
}

export async function rotateRefreshToken(token: string, device: DeviceInfo) {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const stored = await RefreshToken.findOne({ jti: payload.jti, user: payload.id });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token has been revoked or expired");
  }

  const user = await User.findById(payload.id);
  if (!user || !user.isActive) throw ApiError.unauthorized("Account not found or deactivated");
  if (user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized("Token has been invalidated, please log in again");
  }

  // Rotate: revoke old, issue new (prevents refresh-token replay attacks)
  stored.revoked = true;
  await stored.save();

  const tokens = await issueTokenPair(user, device);
  return { user, ...tokens };
}

export async function revokeRefreshToken(token: string) {
  try {
    const payload = verifyRefreshToken(token);
    await RefreshToken.updateOne({ jti: payload.jti }, { revoked: true });
  } catch {
    /* token already invalid - nothing to revoke */
  }
}

export async function revokeAllSessions(userId: string) {
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
  await RefreshToken.updateMany({ user: userId }, { revoked: true });
}

/** Blacklists a still-valid access token (e.g. immediate logout) until its natural expiry. */
export async function blacklistAccessToken(token: string, expSeconds: number) {
  await redisClient.set(`bl:${token}`, "1", { EX: Math.max(expSeconds, 1) });
}