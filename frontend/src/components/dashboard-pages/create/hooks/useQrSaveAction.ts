// components/dashboard-pages/create/hooks/useQrSaveAction.ts
"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import type { AppDispatch } from "@/store";
import { createQr } from "@/store/slices/qrSlice";
import { savePendingQrDraft } from "@/utils/pendingQrDraft";
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
 * build the SavedQr summary for the success modal. Identical behavior,
 * API payload, and upload flow as before — just isolated so `CreateContent`
 * doesn't hold this logic inline.
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

  const handleSave = useCallback(async () => {
    if (!qrName.trim()) return toast.error("Add a name first");
    if (!validateAndReport(formValue)) {
      setStep(2);
      return;
    }
    if (!isAuthenticated) {
      savePendingQrDraft({ type: selectedType, formData: formValue, fgColor: qrDesign.fgColor, bgColor: qrDesign.bgColor });
      router.push("/login?redirect=/create&resume=true");
      return;
    }

    try {
      // Single point where any raw File objects (vcard avatar, gallery
      // images, audio/video/cover files) are uploaded to Cloudinary and
      // swapped for real URLs. Nothing above this line touches the network.
      const uploadedContent = await uploadPendingFiles(formValue, `qr/${selectedType}`);
      setFormValue(uploadedContent);

      const finalQrValue = def.encode(uploadedContent) || "https://example.com";
      const payload = {
        name: qrName.trim(),
        type: selectedType,
        isDynamic,
        destination: finalQrValue,
        design: qrDesign,
        qrValue: finalQrValue,
        content: uploadedContent,
      };

      const result = await dispatch(createQr(payload)).unwrap();
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
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.error(typeof error === "string" ? error : "Couldn't save this QR — try again");
    }
  }, [qrName, validateAndReport, formValue, setStep, isAuthenticated, selectedType, qrDesign, setFormValue, def, isDynamic, dispatch, router]);

  return { savedQr, showSuccessModal, setShowSuccessModal, handleSave };
}