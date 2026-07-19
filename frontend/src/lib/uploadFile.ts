// lib/uploadFile.ts
export interface UploadResult {
  url: string;
  fileName?: string;
  size?: number;
  mimeType?: string;
}

// Global default cap — applies to every upload (images, audio, video)
// unless a caller explicitly passes a different maxSizeMb.
const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export class UploadError extends Error {}

/**
 * Uploads a single File/Blob as multipart/form-data to the Cloudinary
 * route and returns the hosted URL. `accept` defaults to images only —
 * pass an explicit list for audio/video (see uploadPendingFiles.ts) so
 * non-image types aren't rejected by the type check. `maxSizeMb`
 * defaults to the global 10MB cap and applies to every file type.
 */
export async function uploadFile(
  file: File,
  folder: string = "uploads",
  opts: { accept?: string[]; maxSizeMb?: number; onProgress?: (pct: number) => void } = {}
): Promise<string> {
  const accept = opts.accept ?? ACCEPTED_IMAGE_TYPES;
  const maxSizeMb = opts.maxSizeMb ?? MAX_FILE_SIZE_MB;

  if (accept.length && !accept.includes(file.type)) {
    throw new UploadError(`Unsupported file type "${file.type || "unknown"}". Allowed: ${accept.join(", ")}`);
  }
  if (file.size > maxSizeMb * 1024 * 1024) {
    throw new UploadError(`File is too large. Max ${maxSizeMb}MB.`);
  }

  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("folder", folder);

  const result = await new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/cloudinary`);
    xhr.withCredentials = true; // sends the accessToken cookie for `authenticate`

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const url = data?.data?.url ?? data?.url;
          if (!url) throw new Error("No URL in upload response");
          resolve({ url, fileName: data?.data?.fileName, size: data?.data?.size, mimeType: data?.data?.mimeType });
        } catch {
          reject(new UploadError("Upload succeeded but response was malformed"));
        }
      } else {
        reject(new UploadError(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new UploadError("Network error during upload"));

    xhr.send(formData);
  });

  return result.url;
}

/** Convenience wrapper for the common "pick an image, get back a URL" flow used in forms. */
export async function uploadImageFromInput(
  e: React.ChangeEvent<HTMLInputElement>,
  folder: string,
  onProgress?: (pct: number) => void
): Promise<string | null> {
  const file = e.target.files?.[0];
  if (!file) return null;
  return uploadFile(file, folder, { onProgress });
}