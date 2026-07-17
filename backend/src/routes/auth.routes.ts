import { Router } from "express";
import { validate } from "@middlewares/validate.middleware";
import { authenticate, authorizeRoles } from "@middlewares/auth.middleware";
import { UserRole } from "@models/User.model";
import { authRateLimiter } from "@middlewares/rateLimiter.middleware";
import * as authController from "@controllers/auth.controller";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateMeSchema,
  changePasswordSchema,
  googleAuthSchema,
} from "@validators/auth.validator";

const router = Router();

router.post("/register", authRateLimiter, validate(registerSchema), authController.register);
router.post("/login", authRateLimiter, validate(loginSchema), authController.login);
router.post("/google",authRateLimiter,validate(googleAuthSchema),authController.googleAuth);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", authController.logout);
router.post("/logout-all", authenticate, authController.logoutAll);

// NOTE: The /me endpoint should generally be accessible by ALL logged-in users, 
// otherwise normal users won't be able to log in or use the dashboard.
// We've added UserRole.USER here so that it doesn't break your frontend.
router.get("/me", authenticate, authorizeRoles(UserRole.USER, UserRole.ADMIN, UserRole.SUPERADMIN), authController.me);
router.patch("/me", authenticate, validate(updateMeSchema), authController.updateMe);
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;
