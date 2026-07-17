import { Request, Response } from "express";
import { catchAsync } from "@utils/catchAsync";
import { sendSuccess } from "@utils/ApiResponse";
import { ApiError } from "@utils/ApiError";
import { env } from "@config/env";
import {
  registerUser,
  loginUser,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllSessions,
  blacklistAccessToken,
} from "@services/auth.service";
import { User } from "@models/User.model";
import { loginOrRegisterWithGoogle } from "@services/googleAuth.service";
const REFRESH_COOKIE = "refreshToken";
const ACCESS_COOKIE = "accessToken";

function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax" as const,
    domain: env.isProd ? env.COOKIE_DOMAIN : undefined,
    maxAge: maxAgeMs,
  };
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(30 * 24 * 60 * 60 * 1000));
}

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;
  const { user, accessToken, refreshToken } = await registerUser(
    { name, email, password, phone },
    { userAgent: req.headers["user-agent"], ip: req.ip }
  );
  setAuthCookies(res, accessToken, refreshToken);
  sendSuccess(res, 201, "Account created successfully", { user, accessToken });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    throw ApiError.notFound(
      "Account not found. Please create an account first."
    );
  }

  const { user, accessToken, refreshToken } = await loginUser(
    email,
    password,
    {
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    }
  );

  setAuthCookies(res, accessToken, refreshToken);

  sendSuccess(res, 200, `Welcome back, ${user.name}!`, {
    user,
    accessToken,
  });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const token = req.body.refreshToken || req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized("Refresh token missing");

  const { user, accessToken, refreshToken } = await rotateRefreshToken(token, {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  setAuthCookies(res, accessToken, refreshToken);
  sendSuccess(res, 200, "Token refreshed", { user, accessToken });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const refreshTokenCookie = req.cookies?.[REFRESH_COOKIE];
  const accessTokenCookie = req.cookies?.[ACCESS_COOKIE] || req.headers.authorization?.replace("Bearer ", "");

  if (refreshTokenCookie) await revokeRefreshToken(refreshTokenCookie);
  if (accessTokenCookie) await blacklistAccessToken(accessTokenCookie, 15 * 60);

  res.clearCookie(ACCESS_COOKIE);
  res.clearCookie(REFRESH_COOKIE);
  sendSuccess(res, 200, "Logged out successfully");
});

export const logoutAll = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await revokeAllSessions(req.user.id);
  res.clearCookie(ACCESS_COOKIE);
  res.clearCookie(REFRESH_COOKIE);
  sendSuccess(res, 200, "Logged out from all devices");
});

export const me = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await User.findById(req.user.id).populate("currentPlan");
  if (!user) throw ApiError.notFound("User not found");
  sendSuccess(res, 200, "Profile fetched", user);
});

export const updateMe = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { name, phone, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { ...(name && { name }), ...(phone && { phone }), ...(avatar && { avatar }) },
    { new: true }
  );
  sendSuccess(res, 200, "Profile updated", user);
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select("+password");
  if (!user) throw ApiError.notFound("User not found");

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) throw ApiError.badRequest("Old password is incorrect");

  user.password = newPassword;
  user.tokenVersion += 1; // invalidate all existing sessions
  await user.save();

  res.clearCookie(ACCESS_COOKIE);
  res.clearCookie(REFRESH_COOKIE);
  sendSuccess(res, 200, "Password changed. Please log in again.");
});
export const googleAuth = catchAsync(async (req: Request, res: Response) => {
  const { credential } = req.body;
  const { user, accessToken, refreshToken } = await loginOrRegisterWithGoogle(credential, {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  setAuthCookies(res, accessToken, refreshToken);
  sendSuccess(
    res,
    200,
    `Welcome ${user.name}! Signed in successfully with Google.`,
    { user, accessToken }
  );
});