// components/dashboard-pages/create/hooks/useQrSaveAction.ts
"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import type { AppDispatch } from "@/store";
import { createQr } from "@/store/slices/qrSlice";
import {
  savePendingQrDraft,
  clearPendingQrDraft,
} from "@/utils/pendingQrDraft";
import { uploadPendingFiles } from "@/utils/uploadPendingFiles";
import type { QRDesign } from "@/lib/mockData";
import type { QrTypeDefinition, QrTypeId } from "@/lib/qr-types/schema";
import type { SavedQr } from "../create.types";

interface UseQrSaveActionArgs {
  isAuthenticated: boolean;
  selectedType: QrTypeId;
  def: QrTypeDefinition;
  formValue: any;
  setFormValue: (v: any) => void;
  qrName: string;
  isDynamic: boolean;
  qrDesign: QRDesign;
  validateAndReport: (value: any) => boolean;
  setStep: (n: 1 | 2 | 3) => void;
}
/**
 * Owns the entire save pipeline: name check -> validate -> auth gate ->
 * upload pending Files to Cloudinary -> encode -> dispatch createQr ->
 * build the SavedQr summary for the success modal.
 *
 * Auth gate persists the FULL builder state (qrName, isDynamic, design)
 * so the restore hook can reconstruct everything after login.
 *
 * On success always calls clearPendingQrDraft() so a restored draft is
 * not re-triggered on the next visit.
 */
export function useQrSaveAction({
  isAuthenticated,
  selectedType,
  def,
  formValue,
  setFormValue,
  qrName,
  isDynamic,
  qrDesign,
  validateAndReport,
  setStep,
}: UseQrSaveActionArgs) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [savedQr, setSavedQr] = useState<SavedQr | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ── Shared save core — accepts explicit args, zero closure dependency ────
  const executeSave = useCallback(
    async (args: {
      type: QrTypeId;
      def: QrTypeDefinition;
      formData: any;
      qrName: string;
      isDynamic: boolean;
      design: QRDesign;
    }) => {
      console.log("[useQrSaveAction] executeSave START. args:", args);
      const uploadedContent = await uploadPendingFiles(
        args.formData,
        `qr/${args.type}`
      );
      console.log("[useQrSaveAction] uploadPendingFiles finished:", uploadedContent);
      setFormValue(uploadedContent);

      const finalQrValue =
        args.def.encode(uploadedContent) || "https://example.com";
      const payload = {
        name: args.qrName.trim(),
        type: args.type,
        isDynamic: args.isDynamic,
        destination: finalQrValue,
        design: args.design,
        qrValue: finalQrValue,
        content: uploadedContent,
      };

      console.log("[useQrSaveAction] dispatching createQr payload:", payload);
      const result = await dispatch(createQr(payload)).unwrap();
      console.log("[useQrSaveAction] dispatch(createQr) unwrap response:", result);
      const qr = result.data;

      setSavedQr({
        name: qr?.name ?? payload.name,
        type: (qr?.type as QrTypeId) ?? payload.type,
        qrValue: payload.qrValue,
        fgColor: qr?.design?.fgColor ?? payload.design.fgColor,
        bgColor: qr?.design?.bgColor ?? payload.design.bgColor,
        isDynamic: qr?.isDynamic ?? payload.isDynamic,
        shortUrl: qr?.shortUrl,
        design: qr?.design ?? payload.design,
      });

      console.log("[useQrSaveAction] savedQr state updated. Clearing draft and opening modal.");
      // Always clear draft on success so the restore hook doesn't re-fire.
      clearPendingQrDraft();
      setShowSuccessModal(true);
    },
    [dispatch, setFormValue]
  );

  // ── Standard save — reads from React state, used by UI Save buttons ──────
  const handleSave = useCallback(async () => {
    if (!qrName.trim()) return toast.error("Add a name first");
    if (!validateAndReport(formValue)) {
      setStep(2);
      return;
    }

    // Auth gate
    if (!isAuthenticated) {
      savePendingQrDraft({
        type: selectedType,
        formData: formValue,
        qrName: qrName.trim(),
        isDynamic,
        design: qrDesign,
      });
      // Encode ?resume=true into the redirect value so it survives through
      // the login page's own query string parsing.
      router.push("/login?redirect=/dashboard/create%3Fresume%3Dtrue");
      return;
    }

    try {
      await executeSave({
        type: selectedType,
        def,
        formData: formValue,
        qrName,
        isDynamic,
        design: qrDesign,
      });
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.error(
        typeof error === "string"
          ? error
          : "Couldn't save this QR — try again"
      );
    }
  }, [
    qrName,
    validateAndReport,
    formValue,
    setStep,
    isAuthenticated,
    selectedType,
    qrDesign,
    isDynamic,
    def,
    executeSave,
    router,
  ]);

  return {
    savedQr,
    showSuccessModal,
    setShowSuccessModal,
    handleSave,
  };
}