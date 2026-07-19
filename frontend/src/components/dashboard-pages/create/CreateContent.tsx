// components/dashboard-pages/create/CreateContent.tsx
"use client";
import { useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import type { RootState } from "@/store";
import { QR_TYPE_REGISTRY } from "@/lib/qr-types/registry";

import { useQrBuilder } from "./hooks/useQrBuilder";
import { useQrValidation } from "./hooks/useQrValidation";
import { useQrPreviewValue } from "./hooks/useQrPreviewValue";
import { useQrDownloadActions } from "./hooks/useQrDownloadActions";
import { useQrSaveAction } from "./hooks/useQrSaveAction";

import { StepProgress } from "./components/StepProgress";
import { StepNavigation } from "./components/StepNavigation";
import { PreviewPanel } from "./components/PreviewPanel";
import { Step1TypeSelect } from "./components/Step1TypeSelect";
import { Step2ContentForm } from "./components/Step2ContentForm";
import { Step3Designer } from "./components/Step3Designer";
import { QrPreviewModal } from "./lazy";
import type { StepNumber } from "./create.types";

function CreateInner() {
  // Minimal Redux subscriptions — unchanged from original.
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const actionLoading = useSelector((state: RootState) => state.qr.actionLoading);

  const builder = useQrBuilder();
  const {
    def, step, setStep, selectedType, formValue, setFormValue,
    qrDesign, setQrDesign, fgColor, setFgColor, bgColor, setBgColor,
    previewMode, setPreviewMode, qrName, setQrName, isDynamic, setIsDynamic,
    selectType, resetForm, resetCanvas,
  } = builder;

  const { errors, validateAndReport, onChangeClearIfFixed, resetErrors } = useQrValidation(selectedType);

  const qrValue = useQrPreviewValue(def, formValue);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileBaseName = qrName || `qrcode-${selectedType}`;
  const { copied, handleDownload, handleCopy } = useQrDownloadActions(canvasRef, fileBaseName);

  const { savedQr, showSuccessModal, setShowSuccessModal, handleSave } = useQrSaveAction({
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

  // Stable handlers — never recreated unless their real deps change.
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
    // router push handled inside modal callback consumer if needed
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
    <div className="max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground">Create a QR code</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Three steps. Live preview updates as you build.</p>
        </div>
      </div>

      <StepProgress step={step} onJump={onJumpStep} />

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div>
          <AnimatePresence mode="wait">
            {step === 1 && <Step1TypeSelect key="s1" selectedType={selectedType} onSelect={handleTypeSelect} />}

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

          <StepNavigation step={step} actionLoading={actionLoading} onBack={onBack} onNext={onNext} onSave={handleSave} />
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
  );
}

export default function CreateContent() {
  return (
    <DashboardLayout>
      <CreateInner />
    </DashboardLayout>
  );
}