import { Router } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import { authorizeRoles } from "@middlewares/rbac.middleware";
import { UserRole } from "@app-types/enums";
import * as adminController from "@controllers/admin.controller";

const router = Router();

router.use(authenticate, authorizeRoles(UserRole.ADMIN, UserRole.SUPERADMIN));

router.get("/stats", adminController.platformStats);
router.get("/users", adminController.listUsers);
router.get("/users/:id", adminController.getUser);
router.patch("/users/:id/role", adminController.updateUserRole);
router.patch("/users/:id/status", adminController.setUserActive);

export default router;
