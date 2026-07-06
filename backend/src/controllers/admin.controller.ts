import { Request, Response } from "express";
import { catchAsync } from "@utils/catchAsync";
import { sendSuccess } from "@utils/ApiResponse";
import { ApiError } from "@utils/ApiError";
import { User } from "@models/User.model";
import { QRCode } from "@models/QRCode.model";
import { Subscription } from "@models/Subscription.model";
import { UserRole } from "@app-types/enums";

export const listUsers = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = Math.min(parseInt((req.query.limit as string) || "20", 10), 100);
  const search = req.query.search as string | undefined;

  const filter = search
    ? { $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] }
    : {};

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .populate("currentPlan")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, 200, "Users fetched", items, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const getUser = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).populate("currentPlan").select("-password");
  if (!user) throw ApiError.notFound("User not found");
  const [qrCount, activeSub] = await Promise.all([
    QRCode.countDocuments({ owner: user._id }),
    Subscription.findOne({ user: user._id, status: "active" }).populate("plan"),
  ]);
  sendSuccess(res, 200, "User fetched", { user, qrCount, activeSub });
});

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.body as { role: UserRole };
  if (!Object.values(UserRole).includes(role)) throw ApiError.badRequest("Invalid role");

  // Only a superadmin may create/modify other admins/superadmins
  if ((role === UserRole.ADMIN || role === UserRole.SUPERADMIN) && req.user?.role !== UserRole.SUPERADMIN) {
    throw ApiError.forbidden("Only a superadmin can assign admin roles");
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
  if (!user) throw ApiError.notFound("User not found");
  sendSuccess(res, 200, "User role updated", user);
});

export const setUserActive = catchAsync(async (req: Request, res: Response) => {
  const { isActive } = req.body as { isActive: boolean };
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select("-password");
  if (!user) throw ApiError.notFound("User not found");
  sendSuccess(res, 200, `User ${isActive ? "activated" : "deactivated"}`, user);
});

export const platformStats = catchAsync(async (_req: Request, res: Response) => {
  const [totalUsers, totalQRs, activeSubs, scansAgg] = await Promise.all([
    User.countDocuments(),
    QRCode.countDocuments(),
    Subscription.countDocuments({ status: "active" }),
    QRCode.aggregate([{ $group: { _id: null, totalScans: { $sum: "$scansTotal" } } }]),
  ]);

  sendSuccess(res, 200, "Platform stats fetched", {
    totalUsers,
    totalQRs,
    activeSubs,
    totalScans: scansAgg[0]?.totalScans || 0,
  });
});
