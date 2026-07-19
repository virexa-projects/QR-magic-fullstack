// components/dashboard-pages/create/hooks/useQrDraftRestore.ts
"use client";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  getPendingQrDraft,
  clearPendingQrDraft,
} from "@/utils/pendingQrDraft";
import { QR_TYPE_REGISTRY } from "@/lib/qr-types/registry";
import type { QRDesign } from "@/lib/mockData";
import type { QrTypeId } from "@/lib/qr-types/schema";

interface UseQrDraftRestoreArgs {
  /** Whether the user is currently authenticated (from Redux). */
  isAuthenticated: boolean;
  /** Atomic draft restore callback from useQrBuilder. */
  restoreDraft: (draft: {
    type: QrTypeId;
    formData: any;
    qrName: string;
    isDynamic: boolean;
    design: QRDesign;
    fgColor?: string;
    bgColor?: string;
  }) => void;
}

/**
 * Restores a saved draft to autofill the form/builder states after login.
 *
 * Trigger: URL contains `?resume=true` AND isAuthenticated is true AND a
 * non-expired draft exists in localStorage.
 *
 * What it does:
 *   1. Populates type, form data, name, isDynamic, design from the draft
 *   2. Restores fgColor and bgColor states for Step3Designer and PreviewPanel
 *   3. Safely merges draft.formData with the QR type's defaultValue to avoid crashes
 *   4. Advances the builder to step 2 so the user sees the form open and details filled in
 *   5. Clears the draft from localStorage so it doesn't re-trigger
 *   6. Strips ?resume from the URL
 */
export function useQrDraftRestore({
  isAuthenticated,
  restoreDraft,
}: UseQrDraftRestoreArgs): void {
  const searchParams = useSearchParams();

  // Prevents double-fire in React StrictMode / when isAuthenticated flips.
  const restoreFired = useRef(false);

  useEffect(() => {
    const shouldResume = searchParams.get("resume") === "true";
    if (!shouldResume || !isAuthenticated || restoreFired.current) return;

    restoreFired.current = true;

    const draft = getPendingQrDraft();

    // Strip ?resume immediately so hard-refresh can't re-trigger.
    stripResumeParam();

    if (!draft) return;

    // Validate the draft type exists in the registry.
    const typeDef = QR_TYPE_REGISTRY[draft.type as QrTypeId];
    if (!typeDef) {
      clearPendingQrDraft();
      return;
    }

    // Safely merge draft formData with default values to prevent crashes on missing fields (especially vCard)
    const defaultVal = typeDef.defaultValue || {};
    const mergedFormData = {
      ...defaultVal,
      ...draft.formData,
      theme: {
        ...(defaultVal.theme || {}),
        ...(draft.formData.theme || {}),
      },
    };

    // Restore builder state atomically to prevent intermediate/race-condition resets
    restoreDraft({
      type: draft.type as QrTypeId,
      formData: mergedFormData,
      qrName: draft.qrName ?? "",
      isDynamic: draft.isDynamic ?? false,
      design: draft.design as QRDesign,
      fgColor: draft.design?.fgColor,
      bgColor: draft.design?.bgColor,
    });

    // Clear the draft from localStorage after successful autofill
    clearPendingQrDraft();
    console.log("[useQrDraftRestore] draft cleared from localStorage.");
    toast.success("Draft restored! You can now review and save your QR code.");

  // Re-run when isAuthenticated changes to handle async Redux auth resolution.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripResumeParam(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("resume");
  window.history.replaceState(null, "", url.pathname + url.search);
}