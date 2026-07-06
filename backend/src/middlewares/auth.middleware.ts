import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@utils/jwt";
import { ApiError } from "@utils/ApiError";
import { catchAsync } from "@utils/catchAsync";
import { User } from "@models/User.model";
import { redisClient } from "@config/redis";

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  return null;
}

/**
 * Verifies the access token, ensures the user is still active,
 * and rejects tokens that were blacklisted (e.g. after password change / logout-all).
 */
export const authenticate = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized("Authentication token missing");

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  const isBlacklisted = await redisClient.get(`bl:${token}`).catch(() => null);
  if (isBlacklisted) throw ApiError.unauthorized("Token has been revoked");

  const user = await User.findById(payload.id).select("_id role email isActive currentPlan").lean();
  if (!user || !user.isActive) throw ApiError.unauthorized("Account not found or deactivated");

  req.user = {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
    planId: user.currentPlan ? user.currentPlan.toString() : undefined,
  };
  next();
});

/** Attaches req.user if a valid token is present, but never blocks the request. */
export const optionalAuth = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.id).select("_id role email isActive").lean();
    if (user?.isActive) {
      req.user = { id: user._id.toString(), role: user.role, email: user.email };
    }
  } catch (error) {
    /* ignore invalid token for optional auth */
  }
  next();
});

/**
 * Authorizes access based on user roles.
 * Must be used AFTER the `authenticate` middleware.
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Role (${req.user.role}) is not allowed to access this resource`));
    }
    
    next();
  };
};
