// utils/uploadPendingFiles.ts
import { uploadFile } from "@/lib/uploadFile";

export async function uploadPendingFiles<T>(value: T, folder: string): Promise<T> {
  if (value instanceof File) {
    const accept = value.type.startsWith("audio/")
      ? ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm"]
      : value.type.startsWith("video/")
      ? ["video/mp4", "video/webm", "video/ogg", "video/quicktime"]
      : undefined; // falls back to the default image list
    // No maxSizeMb passed — uses the global 10MB default from uploadFile.ts
    const url = await uploadFile(value, folder, { accept });
    return url as unknown as T;
  }
  if (Array.isArray(value)) {
    return (await Promise.all(value.map((v) => uploadPendingFiles(v, folder)))) as unknown as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const entries = await Promise.all(
      Object.entries(value as Record<string, any>).map(
        async ([k, v]) => [k, await uploadPendingFiles(v, folder)] as const
      )
    );
    return Object.fromEntries(entries) as T;
  }
  return value;
}