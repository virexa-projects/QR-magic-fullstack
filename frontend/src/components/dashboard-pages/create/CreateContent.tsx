// components/dashboard-pages/create/CreateContent.tsx
"use client";
import { Suspense, useCallback, useRef, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import type { RootState } from "@/store";
import { QR_TYPE_REGISTRY } from "@/lib/qr-types/registry";
import { getPendingQrDraft, clearPendingQrDraft } from "@/utils/pendingQrDraft";

import { useQrBuilder } from "./hooks/useQrBuilder";
import { useQrValidation } from "./hooks/useQrValidation";
import { useQrPreviewValue } from "./hooks/useQrPreviewValue";
import { useQrDownloadActions } from "./hooks/useQrDownloadActions";
import { useQrSaveAction } from "./hooks/useQrSaveAction";
import { useQrDraftRestore } from "./hooks/useQrDraftRestore";

import { StepProgress } from "./components/StepProgress";
import { StepNavigation } from "./components/StepNavigation";
import { PreviewPanel } from "./components/PreviewPanel";
import { Step1TypeSelect } from "./components/Step1TypeSelect";
import { Step2ContentForm } from "./components/Step2ContentForm";
import { Step3Designer } from "./components/Step3Designer";
import { QrPreviewModal } from "./lazy";
import type { StepNumber } from "./create.types";


// ── Inner component (needs useSearchParams → must be inside <Suspense>) ───────
function CreateInner() {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const actionLoading = useSelector(
    (state: RootState) => state.qr.actionLoading
  );

  const builder = useQrBuilder();
  const {
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
    restoreDraft,
  } = builder;

  const { errors, validateAndReport, onChangeClearIfFixed, resetErrors } =
    useQrValidation(selectedType);

  const qrValue = useQrPreviewValue(def, formValue);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileBaseName = qrName || `qrcode-${selectedType}`;
  const { copied, handleDownload, handleCopy } = useQrDownloadActions(
    canvasRef,
    fileBaseName
  );

  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    // Check if there is an unexpired draft in localStorage on mount
    setHasDraft(!!getPendingQrDraft());
  }, []);

  const handleDiscardDraft = useCallback(() => {
    clearPendingQrDraft();
    resetForm();
    setHasDraft(false);
    toast.success("Draft cleared. Starting fresh.");
  }, [resetForm]);

  const { savedQr, showSuccessModal, setShowSuccessModal, handleSave } =
    useQrSaveAction({
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
    });

  // ── Draft restore — restores builder state ──────
  useQrDraftRestore({
    isAuthenticated,
    restoreDraft,
  });

  // ── Stable handlers ──────────────────────────────────────────────────────
  const handleTypeSelect = useCallback(
    (id: typeof selectedType) => {
      selectType(id);
      resetErrors();
    },
    [selectType, resetErrors]
  );

  const handleFormChange = useCallback(
    (v: any) => {
      setFormValue(v);
      onChangeClearIfFixed(v);
    },
    [setFormValue, onChangeClearIfFixed]
  );

  const onNext = useCallback(() => {
    if (step === 1) setStep(2);
    else if (step === 2) {
      if (!validateAndReport(formValue)) return;
      setStep(3);
      setPreviewMode("qr");
    }
  }, [step, setStep, validateAndReport, formValue, setPreviewMode]);

  const onBack = useCallback(() => {
    if (step === 3) {
      setStep(2);
      setPreviewMode("preview");
    } else if (step === 2) {
      setStep(1);
    }
  }, [step, setStep, setPreviewMode]);

  const onJumpStep = useCallback((n: StepNumber) => setStep(n), [setStep]);

  const handleViewInLibrary = useCallback(() => {
    setShowSuccessModal(false);
    resetForm();
    window.location.assign("/dashboard/codes");
  }, [setShowSuccessModal, resetForm]);

  const handleCreateAnother = useCallback(() => {
    setShowSuccessModal(false);
    resetForm();
  }, [setShowSuccessModal, resetForm]);

  const handleResetCanvas = useCallback(() => {
    resetCanvas();
  }, [resetCanvas]);

  const FormComponent = def.FormComponent;
  const PreviewComponent = def.PreviewComponent;

  return (
    <>
      <div className="max-w-[1400px] mx-auto pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        
          {hasDraft && (
            <button
              onClick={handleDiscardDraft}
              className="self-start sm:self-center px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Clear Draft
            </button>
          )}
        </div>

        <StepProgress step={step} onJump={onJumpStep} />

        <div className="grid lg:grid-cols-[1fr_360px] gap-5">
          <div className="space-y-5">
            <StepNavigation
              step={step}
              actionLoading={actionLoading}
              onBack={onBack}
              onNext={onNext}
              onSave={handleSave}
            />

            <AnimatePresence mode="wait">
              {step === 1 && (
                <Step1TypeSelect
                  key="s1"
                  selectedType={selectedType}
                  onSelect={handleTypeSelect}
                />
              )}

              {step === 2 && (
                <Step2ContentForm
                  key="s2"
                  FormComponent={FormComponent}
                  formValue={formValue}
                  onChange={handleFormChange}
                  errors={errors}
                  qrName={qrName}
                  onQrNameChange={setQrName}
                  onChangeType={() => setStep(1)}
                />
              )}

              {step === 3 && (
                <Step3Designer
                  key="s3"
                  design={qrDesign}
                  fgColor={fgColor}
                  setFgColor={setFgColor}
                  bgColor={bgColor}
                  setBgColor={setBgColor}
                  qrName={qrName}
                  setQrName={setQrName}
                  isDynamic={isDynamic}
                  setIsDynamic={setIsDynamic}
                  onSave={handleSave}
                  isLoading={actionLoading}
                  qrValue={qrValue}
                  onCancel={onBack}
                  setDesign={setQrDesign}
                />
              )}
            </AnimatePresence>
          </div>

          <PreviewPanel
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
            selectedType={selectedType}
            formValue={formValue}
            PreviewComponent={PreviewComponent}
            qrValue={qrValue}
            qrDesign={qrDesign}
            bgColor={bgColor}
            canvasRef={canvasRef}
            copied={copied}
            onDownload={handleDownload}
            onCopy={handleCopy}
            onReset={handleResetCanvas}
          />
        </div>

        <QrPreviewModal
          open={showSuccessModal}
          onClose={handleCreateAnother}
          onViewInLibrary={handleViewInLibrary}
          onCreateAnother={handleCreateAnother}
          qrName={savedQr?.name ?? qrName}
          qrType={savedQr?.type ?? selectedType}
          qrValue={savedQr?.shortUrl ?? qrValue}
          fgColor={savedQr?.fgColor ?? fgColor}
          bgColor={savedQr?.bgColor ?? bgColor}
          isDynamic={savedQr?.isDynamic ?? isDynamic}
          shortUrl={savedQr?.shortUrl}
          design={savedQr?.design ?? qrDesign}
        />
      </div>
    </>
  );
}

// Suspense is required because useSearchParams (used inside useQrDraftRestore)
// can suspend during server-side rendering in Next.js App Router.
export default function CreateContent() {
  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <CreateInner />
      </Suspense>
    </DashboardLayout>
  );
}