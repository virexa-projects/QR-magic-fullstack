"use client";
import { useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { createQr } from "@/store/slices/qrSlice";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, Sparkles, RotateCcw, Copy, Check, Eye, QrCode, Save, ArrowLeft, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import QrPreviewModal from "@/components/dashboard/QrPreviewModal";
import { savePendingQrDraft } from "@/utils/pendingQrDraft";
import StyledQrPreview from "../dashboard/StyledQrPreview";
import type { QRDesign } from "@/lib/mockData";
import Step3Qr from "@/components/qr-builder/Step3Qr";
import QrTypeGrid from "@/components/qr-builder/QrTypeGrid";
import PhoneFrame from "@/components/qr-builder/preview/PhoneFrame";
import { QR_TYPE_REGISTRY } from "@/lib/qr-types/registry";
import { validateQrValue, type QrTypeId } from "@/lib/qr-types/schema";

const presetColors = [
  { fg: "#000000", bg: "#FFFFFF", name: "Classic" },
  { fg: "#000099", bg: "#FFFFFF", name: "Brand" },
  { fg: "#1a1a2e", bg: "#F5F5F5", name: "Slate" },
  { fg: "#0d9488", bg: "#FFFFFF", name: "Teal" },
  { fg: "#dc2626", bg: "#FFFFFF", name: "Red" },
  { fg: "#ea580c", bg: "#FFFFFF", name: "Orange" },
];

const STEPS = [
  { n: 1, label: "Type" },
  { n: 2, label: "Content" },
  { n: 3, label: "Create QR" },
];

function CreateInner() {
  const router = useRouter();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const dispatch = useDispatch<AppDispatch>();
  const { actionLoading } = useSelector((state: RootState) => state.qr);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<QrTypeId>("url");
  const [formValue, setFormValue] = useState<any>(QR_TYPE_REGISTRY.url.defaultValue);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [fgColor, setFgColor] = useState("#000099");
  const [qrDesign, setQrDesign] = useState<QRDesign>({
    fgColor: "#000099",
    bgColor: "#FFFFFF",
    eyeColor: "#000099",
    dotStyle: "rounded",
    frame: "none",
    useGradient: false,
    gradientColors: ["#000099", "#7c3aed"],
    gradientType: "linear",
    gradientRotation: 45,
    cornersSquareStyle: "extra-rounded",
    cornersDotStyle: "dot",
    frameColor: "#000099",
    frameText: "SCAN ME",
    logo: "",
    logoSize: 0.22,
    hideBackgroundDots: true,
    errorCorrectionLevel: "H",
  });
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<"preview" | "qr">("preview");
  const [qrName, setQrName] = useState("");
  const [isDynamic, setIsDynamic] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedQr, setSavedQr] = useState<{
    name: string; type: QrTypeId; qrValue: string; fgColor: string; bgColor: string;
    isDynamic: boolean; shortUrl?: string; design?: QRDesign;
  } | null>(null);

  const def = QR_TYPE_REGISTRY[selectedType];

  const getQRValue = useCallback((): string => {
    try {
      return def.encode(formValue) || "https://example.com";
    } catch {
      return "https://example.com";
    }
  }, [def, formValue]);

  const selectType = (id: QrTypeId) => {
    setSelectedType(id);
    setFormValue(QR_TYPE_REGISTRY[id].defaultValue);
    setErrors({});
  };

  const setFormField = (v: any) => {
    setFormValue(v);
    if (Object.keys(errors).length) {
      const { errors: nextErrors } = validateQrValue(selectedType, v);
      setErrors(nextErrors);
    }
  };

  const validateStep2 = (): boolean => {
    const result = validateQrValue(selectedType, formValue);
    setErrors(result.errors);
    if (!result.success) {
      const firstMessage = Object.values(result.errors)[0];
      toast.error(firstMessage || "Please fix the highlighted fields");
    }
    return result.success;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (canvas) {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${qrName || `qrcode-${selectedType}`}.png`;
      a.click();
      toast.success("Downloaded");
      return;
    }
    const svg = canvasRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (svg) {
      const xml = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([xml], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${qrName || `qrcode-${selectedType}`}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
      return;
    }
    toast.error("Nothing to download yet");
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (canvas) {
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      });
      return;
    }
    const svg = canvasRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (svg) {
      const xml = new XMLSerializer().serializeToString(svg);
      await navigator.clipboard.writeText(xml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      return;
    }
    toast.error("Nothing to copy yet");
  };

  // FIX: previously hardcoded fgColor/bgColor/dotStyle:"square"/frame:"none"
  // and separately re-spread vcardTheme.bannerColor/accentColor onto `design`.
  // Those two keys aren't declared on the Mongoose designSchema (which is
  // strict, not Mixed), so they were silently dropped on save anyway — the
  // vCard's real banner/accent colors already live safely inside
  // `content.theme` (formValue.theme), which is stored via the
  // Schema.Types.Mixed `content` field. Now `design` is just the full,
  // correct qrDesign object the user actually built in Step 3.
  const buildPayload = () => {
    const finalQrValue = getQRValue();

    return {
      name: qrName.trim(),
      type: selectedType,
      isDynamic,
      destination: finalQrValue,
      design: qrDesign,
      qrValue: finalQrValue,
      content: formValue,
    };
  };

  const resetForm = () => {
    setFormValue(QR_TYPE_REGISTRY[selectedType].defaultValue);
    setErrors({});
    setQrName("");
    setStep(1);
    setPreviewMode("preview");
  };

  const handleSave = async () => {
    if (!qrName.trim()) return toast.error("Add a name first");
    if (!validateStep2()) {
      setStep(2);
      return;
    }
    if (!isAuthenticated) {
      savePendingQrDraft({ type: selectedType, formData: formValue, fgColor, bgColor });
      router.push("/login?redirect=/create&resume=true");
      return;
    }
    const payload = buildPayload();
    try {
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
      console.error("Redux dispatch rejection traceback:", error);
      toast.error(typeof error === "string" ? error : "Couldn't save this QR — try again");
    }
  };

  const handleViewInLibrary = () => {
    setShowSuccessModal(false);
    resetForm();
    router.push("codes");
  };
  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    resetForm();
  };

  const onNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
      setPreviewMode("qr");
    }
  };
  const onBack = () => {
    if (step === 3) { setStep(2); setPreviewMode("preview"); }
    else if (step === 2) setStep(1);
  };

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

      {/* Stepper bar */}
      <div className="bg-card rounded-xl border border-border p-3 mb-5">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const active = step === s.n;
            const done = step > s.n;
            return (
              <div key={s.n} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => (done ? setStep(s.n as 1 | 2 | 3) : null)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${active ? "bg-primary/10" : done ? "hover:bg-secondary cursor-pointer" : ""}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition ${active ? "bg-primary text-primary-foreground" : done ? "bg-lime text-lime-foreground" : "bg-secondary text-muted-foreground"
                    }`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : s.n}
                  </span>
                  <span className={`text-xs font-semibold ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px ${done ? "bg-lime" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        {/* LEFT — step content */}
        <div>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }}>
                <QrTypeGrid selected={selectedType} onSelect={selectType} />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }} className="space-y-4">
                <div className="bg-card rounded-xl border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Name this QR</h3>
                  <p className="text-[11px] text-muted-foreground mb-3">For your library — won't appear on the code.</p>
                  <Input placeholder="e.g. Diwali landing page" value={qrName} onChange={(e) => setQrName(e.target.value)} className="h-10" />
                </div>
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Add your content</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Watch the phone preview update as you type.</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                    Change type
                  </button>
                </div>
                <FormComponent value={formValue} onChange={setFormField} errors={errors} />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18 }}
              >
                <Step3Qr
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
                  presetColors={presetColors}
                  qrValue={getQRValue()}
                  onCancel={onBack}
                  setDesign={setQrDesign}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step nav — sticky bottom bar so Back/Next are always reachable,
              full-width tap targets on mobile so they're easy to hit. */}
          <div className="sticky bottom-0 z-30 mt-6 -mx-4 sm:mx-0 px-4 sm:px-5 py-3 flex items-center gap-3 bg-card/95 backdrop-blur border-t border-border sm:border sm:rounded-xl shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.08)] sm:shadow-none">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={step === 1}
              className="flex-1 sm:flex-none h-11 gap-1.5 justify-center text-foreground disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>

            <div className="hidden sm:block flex-1 text-center text-[11px] font-medium text-muted-foreground">
              Step {step} of 3 — {STEPS[step - 1].label}
            </div>

            {step < 3 ? (
              <Button onClick={onNext} className="flex-1 sm:flex-none h-11 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 justify-center">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={actionLoading} className="w-1/4 h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                <Save className="w-4 h-4 mr-2" /> {actionLoading ? "Saving…" : "Save to library"}
              </Button>
            )}
          </div>
        </div>

        {/* RIGHT — sticky preview */}
        <div className="lg:sticky lg:top-20 h-fit space-y-3">
          <div className="flex bg-card rounded-lg p-1 border border-border">
            <button
              onClick={() => setPreviewMode("preview")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${previewMode === "preview" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button
              onClick={() => setPreviewMode("qr")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${previewMode === "qr" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              <QrCode className="w-3.5 h-3.5" /> QR code
            </button>
          </div>

          <AnimatePresence mode="wait">
            {previewMode === "preview" ? (
              <motion.div key="phone" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.15 }} className="bg-card rounded-xl border border-border p-5 flex justify-center">
                <PhoneFrame animKey={selectedType}>
                  <PreviewComponent value={formValue} />
                </PhoneFrame>
              </motion.div>
            ) : (
              <motion.div key="qr" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.15 }} className="bg-card rounded-xl border border-border p-5">
                <div ref={canvasRef} className="flex items-center justify-center p-5 rounded-lg mb-4 border border-border" style={{ backgroundColor: bgColor }}>
                  <StyledQrPreview value={getQRValue()} size={200} design={qrDesign} />
                </div>
                <Button onClick={handleDownload} className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold mb-2">
                  <Download className="w-4 h-4 mr-2" /> Download PNG
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs h-9">
                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setFormValue(QR_TYPE_REGISTRY[selectedType].defaultValue); setQrName(""); setErrors({}); }} className="text-xs h-9">
                    <RotateCcw className="w-3 h-3 mr-1" /> Reset
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Sparkles className="w-3 h-3 text-lime shrink-0" />
                  Error correction H — works even with 30% damage
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <QrPreviewModal
        open={showSuccessModal}
        onClose={handleCreateAnother}
        onViewInLibrary={handleViewInLibrary}
        onCreateAnother={handleCreateAnother}
        qrName={savedQr?.name ?? qrName}
        qrType={savedQr?.type ?? selectedType}
        qrValue={savedQr?.shortUrl ?? getQRValue()}
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