// hooks/useFilePreviewUrl.ts
import { useEffect, useState } from "react";

/** Renders a live blob preview for an unsaved File, or passes through a real URL string. */
export function useFilePreviewUrl(value: string | File | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(typeof value === "string" ? value : undefined);

  useEffect(() => {
    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setUrl(typeof value === "string" ? value : undefined);
  }, [value]);

  return url;
}