// components/dashboard-pages/create/hooks/useQrDraftRestore.ts
"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  getPendingQrDraft,
  clearPendingQrDraft,
} from "@/utils/pendingQrDraft";
import { QR_TYPE_REGISTRY } from "@/lib/qr-types/registry";
import type { QRDesign } from "@/lib/mockData";
import type { QrTypeId } from "@/lib/qr-types/schema";
import type { StepNumber } from "../create.types";
import type { DraftSaveArgs } from "./useQrSaveAction";

interface UseQrDraftRestoreArgs {
  /** Whether the user is currently authenticated (from Redux). */
  isAuthenticated: boolean;
  /** Builder setters — all come from useQrBuilder. */
  selectType: (id: QrTypeId) => void;
  setFormValue: (v: any) => void;
  setQrName: (n: string) => void;
  setIsDynamic: (b: boolean) => void;
  setQrDesign: (d: QRDesign) => void;
  setStep: (n: StepNumber) => void;
  setFgColor: (c: string) => void;
  setBgColor: (c: string) => void;
  /** Auto-save function — uses explicit args to avoid stale closures. */
  handleSaveWithDraft: (draft: DraftSaveArgs) => Promise<void>;
}

/**
 * Restores a saved draft and **automatically saves it** after login.
 *
 * Trigger: URL contains `?resume=true` AND isAuthenticated is true AND a
 * non-expired draft exists in localStorage.
 *
 * What it does:
 *   1. Populates type, form data, name, isDynamic, design from the draft
 *   2. Restores fgColor and bgColor states for Step3Designer and PreviewPanel
 *   3. Safely merges draft.formData with the QR type's defaultValue to avoid crashes
 *   4. Advances the builder to step 3 so the user sees the full preview
 *   5. Calls handleSaveWithDraft() to auto-upload files and save to DB
 *   6. On success → success modal opens, draft cleared (handled by executeSave)
 *   7. On failure → shows error toast; builder stays on step 3 for manual retry
 *   8. Strips ?resume from the URL
 */
export function useQrDraftRestore({
  isAuthenticated,
  selectType,
  setFormValue,
  setQrName,
  setIsDynamic,
  setQrDesign,
  setStep,
  setFgColor,
  setBgColor,
  handleSaveWithDraft,
}: UseQrDraftRestoreArgs): void {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Prevents double-fire in React StrictMode / when isAuthenticated flips.
  const restoreFired = useRef(false);

  useEffect(() => {
    const shouldResume = searchParams.get("resume") === "true";
    if (!shouldResume || !isAuthenticated || restoreFired.current) return;

    restoreFired.current = true;

    const draft = getPendingQrDraft();

    // Strip ?resume immediately so hard-refresh can't re-trigger.
    stripResumeParam(router);

    if (!draft) return;

    // Validate the draft type exists in the registry.
    const typeDef = QR_TYPE_REGISTRY[draft.type as QrTypeId];
    if (!typeDef) {
      clearPendingQrDraft();
      return;
    }

    // ── Restore builder UI state ──────────────────────────────────────────
    // selectType() resets formValue to defaultValue — call setFormValue AFTER.
    selectType(draft.type as QrTypeId);

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

    setFormValue(mergedFormData);
    setQrName(draft.qrName ?? "");
    setIsDynamic(draft.isDynamic ?? false);
    setQrDesign(draft.design as QRDesign);
    if (draft.design?.fgColor) setFgColor(draft.design.fgColor);
    if (draft.design?.bgColor) setBgColor(draft.design.bgColor);

    // Jump to step 3 so user sees the designer with all details filled in.
    setStep(3);

    // ── Auto-save — upload files + save to DB ─────────────────────────────
    // Uses explicit draft data to bypass stale React state closures.
    const saveArgs: DraftSaveArgs = {
      type: draft.type as QrTypeId,
      def: typeDef,
      formData: mergedFormData,
      qrName: draft.qrName ?? "",
      isDynamic: draft.isDynamic ?? false,
      design: draft.design as QRDesign,
    };

    toast.loading("Saving your draft…", { id: "draft-auto-save" });

    handleSaveWithDraft(saveArgs)
      .then(() => {
        toast.dismiss("draft-auto-save");
        // Success modal is opened by executeSave inside useQrSaveAction.
        // Draft is also cleared from localStorage there.
      })
      .catch(() => {
        toast.dismiss("draft-auto-save");
        // Error toast is already shown by handleSaveWithDraft.
        // Builder state is restored, so user can manually click Save.
      });

  // Re-run when isAuthenticated changes to handle async Redux auth resolution.
  // restoreFired ref prevents double-execution.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripResumeParam(router: ReturnType<typeof useRouter>): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("resume");
  router.replace(url.pathname + (url.search || ""), { scroll: false });
}