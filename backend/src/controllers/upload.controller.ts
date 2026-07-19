// controllers/upload.controller.ts
import { Request, Response } from "express";
import { catchAsync } from "@utils/catchAsync";
import { sendSuccess } from "@utils/ApiResponse";
import { ApiError } from "@utils/ApiError";
import { uploadBufferToCloudinary } from "@services/cloudinaryUpload.service";

export const uploadToCloudinary = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No file provided");
  const folder = (req.body.folder as string) || "misc";

  const isVideo = req.file.mimetype.startsWith("video/");
  const isAudio = req.file.mimetype.startsWith("audio/");
  // Cloudinary has no dedicated "audio" resource type — audio files go
  // through the "video" pipeline (it's just a media/AV pipeline internally).
  const resourceType = isVideo || isAudio ? "video" : "auto";

  const result = await uploadBufferToCloudinary(req.file.buffer, folder, resourceType);

  sendSuccess(res, 200, "File uploaded", {
    url: result.url,
    fileName: req.file.originalname,
    size: result.bytes,
    mimeType: req.file.mimetype,
  });
});