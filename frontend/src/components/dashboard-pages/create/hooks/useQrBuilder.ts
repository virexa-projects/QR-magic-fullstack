// components/dashboard-pages/create/hooks/useQrBuilder.ts
"use client";
import { useCallback, useState } from "react";
import type { QRDesign } from "@/lib/mockData";
import { QR_TYPE_REGISTRY } from "@/lib/qr-types/registry";
import type { QrTypeId } from "@/lib/qr-types/schema";
import { DEFAULT_QR_DESIGN } from "../create.constants";
import type { PreviewMode, StepNumber } from "../create.types";

/**
 * Owns all "what is the user building" state: step, selected QR type,
 * form content, design/colors, and name. Kept separate from validation
 * and save/download logic so components consuming only a slice of this
 * (e.g. PreviewPanel) don't re-render on unrelated state changes.
 */
export function useQrBuilder() {
  const [step, setStep] = useState<StepNumber>(1);
  const [selectedType, setSelectedType] = useState<QrTypeId>("url");
  const [formValue, setFormValueState] = useState<any>(QR_TYPE_REGISTRY.url.defaultValue);

  const [qrDesign, setQrDesign] = useState<QRDesign>(DEFAULT_QR_DESIGN);
  const [fgColor, setFgColor] = useState("#000099");
  const [bgColor, setBgColor] = useState("#FFFFFF");

  const [previewMode, setPreviewMode] = useState<PreviewMode>("preview");
  const [qrName, setQrName] = useState("");
  const [isDynamic, setIsDynamic] = useState(false);

  const def = QR_TYPE_REGISTRY[selectedType];

  const selectType = useCallback((id: QrTypeId) => {
    setSelectedType(id);
    setFormValueState(QR_TYPE_REGISTRY[id].defaultValue);
  }, []);

  const setFormValue = useCallback((v: any) => setFormValueState(v), []);

  const resetForm = useCallback(() => {
    setFormValueState(QR_TYPE_REGISTRY[selectedType].defaultValue);
    setQrName("");
    setStep(1);
    setPreviewMode("preview");
  }, [selectedType]);

  const resetCanvas = useCallback(() => {
    setFormValueState(QR_TYPE_REGISTRY[selectedType].defaultValue);
    setQrName("");
  }, [selectedType]);

  return {
    def,
    step,
    setStep,
    selectedType,
    formValue,
    setFormValue,
    qrDesign,
    setQrDesign,
    fgColor,
    setFgColor,
    bgColor,
    setBgColor,
    previewMode,
    setPreviewMode,
    qrName,
    setQrName,
    isDynamic,
    setIsDynamic,
    selectType,
    resetForm,
    resetCanvas,
  };
}