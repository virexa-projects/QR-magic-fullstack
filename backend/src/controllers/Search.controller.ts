import { Request, Response, NextFunction } from "express";
import { searchQRCodes } from "../services/Search.service";

function getUserId(req: Request): string {
  return (req as any).user?.id || (req as any).user?._id?.toString();
}

export async function searchQR(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const q = (req.query.q as string) || "";
    const limit = parseInt((req.query.limit as string) || "8", 10);

    const results = await searchQRCodes(userId, q, limit);
    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
}