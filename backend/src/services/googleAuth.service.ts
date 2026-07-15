import { OAuth2Client } from "google-auth-library";
import { env } from "@config/env";
import { User, IUser } from "@models/User.model";
import { Plan } from "@models/Plan.model";
import { ApiError } from "@utils/ApiError";
import { UserRole } from "@app-types/enums";
import { issueTokenPair } from "@services/auth.service";
import * as billingService from "@services/billing.service";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

interface DeviceInfo {
  userAgent?: string;
  ip?: string;
}

async function verifyGoogleIdToken(idToken: string) {
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch {
    throw ApiError.unauthorized("Invalid or expired Google credential");
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw ApiError.unauthorized("Invalid Google token");
  }
  if (!payload.email_verified) {
    throw ApiError.unauthorized("Google email is not verified");
  }
  return payload;
}

/**
 * Handles both Google One Tap and the Google Sign-In button.
 * Both deliver the same signed JWT credential to verify.
 * - If a user with this email already exists (registered via email/password),
 *   it links the googleId to that account so either method can log them in.
 * - Otherwise it auto-registers a new account on the Free plan.
 */
export async function loginOrRegisterWithGoogle(idToken: string, device: DeviceInfo) {
  const payload = await verifyGoogleIdToken(idToken);
  const email = payload.email!.toLowerCase();

  let user: IUser | null = await User.findOne({ email });

  if (user) {
    if (!user.isActive) throw ApiError.forbidden("Account has been deactivated");

    if (!user.googleId) {
      user.googleId = payload.sub;
      if (payload.picture && !user.avatar) user.avatar = payload.picture;
      if (!user.isVerified) user.isVerified = true;
    }
  } else {
    const freePlan = await Plan.findOne({ slug: "free", isActive: true });
    if (!freePlan) throw new Error("Free plan not found");

    user = await User.create({
      name: payload.name || email.split("@")[0],
      email,
      googleId: payload.sub,
      avatar: payload.picture,
      isVerified: true,
      role: UserRole.USER,
      currentPlan: freePlan._id,
    });

    await billingService.subscribeUserToPlan(
      user._id.toString(),
      freePlan._id.toString(),
      { paymentGateway: "free", paymentId: "free-plan", autoRenew: false }
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueTokenPair(user, device);
  return { user, ...tokens };
}