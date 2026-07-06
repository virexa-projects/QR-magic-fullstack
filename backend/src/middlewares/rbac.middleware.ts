import { Request, Response, NextFunction } from "express";
import { ApiError } from "@utils/ApiError";
import { UserRole } from "@app-types/enums";

/**
 * Restricts a route to the given roles.
 * Usage: router.get('/admin', authenticate, authorizeRoles(UserRole.ADMIN, UserRole.SUPERADMIN), handler)
 */
export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized("Authentication required"));
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }
    next();
  };
}

/**
 * Ensures a user can only access/modify their own resource, unless they are admin/superadmin.
 * ownerIdExtractor pulls the resource's owner id (usually already loaded onto req by a controller/service).
 */
export function authorizeOwnerOrRoles(
  ownerIdExtractor: (req: Request) => string | undefined,
  ...allowedRoles: UserRole[]
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized("Authentication required"));
    const ownerId = ownerIdExtractor(req);
    if (req.user.id === ownerId || allowedRoles.includes(req.user.role)) return next();
    return next(ApiError.forbidden("You do not have permission to access this resource"));
  };
}
