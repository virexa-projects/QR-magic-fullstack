// lib/uploadFile.ts
//
// Real binary file upload — sends the actual File object as multipart
// FormData (not a base64 data-URL) so it lands on the multer middleware
// as req.file, same as the rest of the QRBharat upload pipeline (logo,
// avatar, menu images, etc).
//
// Usage:
//   const url = await uploadFile(file, "vcard-avatars");
//   set("avatarUrl", url);

export interface UploadResult {
  url: string;
  fileName?: string;
  size?: number;
  mimeType?: string;
}

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

export class UploadError extends Error {}

/**
 * Uploads a single File/Blob as multipart/form-data to the backend upload
 * endpoint and returns the hosted URL. Do NOT set a Content-Type header
 * manually — the browser needs to set its own multipart boundary or the
 * multer middleware will fail to parse the body.
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
  // Field name "file" must match the multer field name on the backend,
  // e.g. upload.single("file").
  formData.append("file", file, file.name);
  formData.append("folder", folder);

  // Use XHR instead of fetch so we can report real upload progress for
  // the loading UI (fetch has no upload-progress event).
  const result = await new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.withCredentials = true; // send auth cookie/session

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const url = data?.url ?? data?.data?.url;
          if (!url) throw new Error("No URL in upload response");
          resolve({ url, fileName: data?.fileName, size: data?.size, mimeType: data?.mimeType });
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
