// services/cloudinaryUpload.service.ts
import cloudinary from "@config/cloudinary";
import { Readable } from "stream";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
}

export function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "video" | "raw" | "auto" = "auto"
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `qrbharat/${folder}`, resource_type: resourceType },
      (error, result) => {
        if (error || !result) return reject(error || new Error("Cloudinary upload failed"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        });
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}