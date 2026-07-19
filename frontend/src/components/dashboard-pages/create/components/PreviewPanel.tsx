// components/dashboard-pages/create/components/PreviewPanel.tsx
"use client";
import { memo, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Check, Download, Eye, QrCode, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QRDesign } from "@/lib/mockData";
import type { QrTypeDefinition } from "@/lib/qr-types/schema";
import { StyledQrPreview, PhoneFrame } from "../lazy";
import type { PreviewMode } from "../create.types";

interface Props {
  previewMode: PreviewMode;
  onPreviewModeChange: (m: PreviewMode) => void;
  selectedType: string;
  formValue: any;
  PreviewComponent: QrTypeDefinition["PreviewComponent"];
  qrValue: string;
  qrDesign: QRDesign;
  bgColor: string;
  canvasRef: RefObject<HTMLDivElement>;
  copied: boolean;
  onDownload: () => void;
  onCopy: () => void;
  onReset: () => void;
}

/**
 * Isolated right column. Memoized so typing in a Step 2 form field, or
 * unrelated state elsewhere in CreateContent, never re-renders the QR
 * canvas or phone preview. AnimatePresence mode="wait" already ensures
 * the hidden branch (Preview vs QR) is fully unmounted, not just
 * visually hidden — satisfies "don't render PreviewComponent when hidden".
 */
function PreviewPanelBase({
  previewMode,
  onPreviewModeChange,
  selectedType,
  formValue,
  PreviewComponent,
  qrValue,
  qrDesign,
  bgColor,
  canvasRef,
  copied,
  onDownload,
  onCopy,
  onReset,
}: Props) {
  return (
    <div className="lg:sticky lg:top-20 h-fit space-y-3">
      <div className="flex bg-card rounded-lg p-1 border border-border">
        <button
          onClick={() => onPreviewModeChange("preview")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
            previewMode === "preview" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>
        <button
          onClick={() => onPreviewModeChange("qr")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
            previewMode === "qr" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <QrCode className="w-3.5 h-3.5" /> QR code
        </button>
      </div>

      <AnimatePresence mode="wait">
        {previewMode === "preview" ? (
          <motion.div
            key="phone"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="bg-card rounded-xl border border-border p-5 flex justify-center"
          >
            <PhoneFrame animKey={selectedType}>
              <PreviewComponent value={formValue} />
            </PhoneFrame>
          </motion.div>
        ) : (
          <motion.div
            key="qr"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <div
              ref={canvasRef}
              className="flex items-center justify-center p-5 rounded-lg mb-4 border border-border"
              style={{ backgroundColor: bgColor }}
            >
              <StyledQrPreview value={qrValue} size={200} design={qrDesign} />
            </div>
            <Button onClick={onDownload} className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold mb-2">
              <Download className="w-4 h-4 mr-2" /> Download PNG
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={onCopy} className="text-xs h-9">
                {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="outline" size="sm" onClick={onReset} className="text-xs h-9">
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
  );
}

export const PreviewPanel = memo(PreviewPanelBase);