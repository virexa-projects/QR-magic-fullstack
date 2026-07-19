// components/dashboard-pages/create/hooks/useQrPreviewValue.ts
"use client";
import { useMemo } from "react";
import type { QrTypeDefinition } from "@/lib/qr-types/schema";

/**
 * Memoizes the encoded QR payload. Previously `getQRValue()` was a
 * useCallback that got INVOKED directly in JSX in multiple places,
 * re-running def.encode() on every render regardless of cause. Now it's
 * a plain memoized value, recomputed only when `def` or `formValue`
 * actually change (not on design/color/step/copy-state changes).
 */
export function useQrPreviewValue(def: QrTypeDefinition, formValue: any): string {
  return useMemo(() => {
    try {
      return def.encode(formValue) || "https://example.com";
    } catch {
      return "https://example.com";
    }
  }, [def, formValue]);
}