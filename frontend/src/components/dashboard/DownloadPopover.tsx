"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import QRCodeStyling from "qr-code-styling";
import { toPng } from "html-to-image";
import { Download, FileImage, FileCode, FileText as FilePdf } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import type { QRDesign } from "@/lib/mockData";
import FramedPreview from "@/components/qr/FramedPreview";

interface Props {
  value: string;
  design: QRDesign;
  filename: string;
  trigger: React.ReactNode;
}

const SIZES = [256, 512, 1024, 2048];

export default function DownloadPopover({ value, design, filename, trigger }: Props) {
  const [size, setSize] = useState(512);
  const [open, setOpen] = useState(false);

  const [holderNode, setHolderNode] = useState<HTMLDivElement | null>(null);
  const holderRef = useCallback((node: HTMLDivElement | null) => setHolderNode(node), []);
  const qrInstanceRef = useRef<QRCodeStyling | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const safeName = filename.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "qrcode";

  const buildOptions = () => ({
    width: size,
    height: size,
    type: "svg" as const,
    data: value || "https://example.com",
    margin: Math.round(size * 0.03),
    qrOptions: { errorCorrectionLevel: design.errorCorrectionLevel || "H" },
    dotsOptions: design.useGradient
      ? {
          type: design.dotStyle as any,
          gradient: {
            type: design.gradientType || "linear",
            rotation: ((design.gradientRotation || 0) * Math.PI) / 180,
            colorStops:
              design.gradientColors?.map((c, index) => ({
                offset: index / ((design.gradientColors?.length || 2) - 1),
                color: c,
              })) || [],
          },
        }
      : { type: design.dotStyle as any, color: design.fgColor },
    backgroundOptions: { color: design.bgColor || "#FFFFFF" },
    cornersSquareOptions: {
      type: design.cornersSquareStyle as any,
      color: design.eyeColor || design.fgColor,
    },
    cornersDotOptions: {
      type: design.cornersDotStyle as any,
      color: design.eyeColor || design.fgColor,
    },
    image: design.logo || undefined,
    imageOptions: {
      crossOrigin: "anonymous" as const,
      margin: 4,
      imageSize: design.logoSize || 0.22,
      hideBackgroundDots: design.hideBackgroundDots ?? true,
    },
  });

  // (Re)build the qr-code-styling instance whenever the popover is open
  // and the value/design/size changes.
  useEffect(() => {
    qrInstanceRef.current = null;
  }, [holderNode]);

  useEffect(() => {
    if (!open || !holderNode) return;
    if (!qrInstanceRef.current) {
      qrInstanceRef.current = new QRCodeStyling(buildOptions());
      qrInstanceRef.current.append(holderNode);
    } else {
      qrInstanceRef.current.update(buildOptions());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, holderNode, design, value, size]);

  const downloadPNG = async () => {
    if (!previewRef.current) return toast.error("Render failed");
    try {
      const dataUrl = await toPng(previewRef.current, {
        quality: 1.0,
        pixelRatio: 1, // size is already baked into the qr-code-styling render
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${safeName}-${size}.png`;
      a.click();
      toast.success(`Downloaded ${size}px PNG`);
    } catch (err) {
      console.error("PNG export failed:", err);
      toast.error("Download failed");
    }
  };

  const downloadSVG = () => {
    // SVG export is vector, so it captures the styled QR itself (dots,
    // corners, gradient) but not the HTML/CSS frame decoration.
    const svg = holderNode?.querySelector("svg") as SVGSVGElement | null;
    if (!svg) return toast.error("Render failed");
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded SVG");
  };

  const downloadPDF = async () => {
    if (!previewRef.current) return toast.error("Render failed");
    try {
      const img = await toPng(previewRef.current, { quality: 1.0, pixelRatio: 2 });
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const qrSize = 100;
      const x = (pageW - qrSize) / 2;
      pdf.setFontSize(14);
      pdf.text(filename, pageW / 2, 30, { align: "center" });
      pdf.addImage(img, "PNG", x, 50, qrSize, qrSize);
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text("Scan with your phone camera", pageW / 2, 165, { align: "center" });
      pdf.save(`${safeName}.pdf`);
      toast.success("Downloaded PDF");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Download failed");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-foreground mb-1.5">Size</div>
            <div className="grid grid-cols-4 gap-1">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`text-[11px] font-medium py-1.5 rounded-md border transition ${size === s
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background border-border text-muted-foreground hover:border-foreground/40"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground mb-1.5">Format</div>
            <div className="space-y-1">
              <Button onClick={downloadPNG} variant="ghost" className="w-full h-9 justify-start gap-2 text-xs">
                <FileImage className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">PNG</span>
                <span className="text-muted-foreground ml-auto">Includes frame</span>
              </Button>
              <Button onClick={downloadSVG} variant="ghost" className="w-full h-9 justify-start gap-2 text-xs">
                <FileCode className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">SVG</span>
                <span className="text-muted-foreground ml-auto">QR only, scalable</span>
              </Button>
              <Button onClick={downloadPDF} variant="ghost" className="w-full h-9 justify-start gap-2 text-xs">
                <FilePdf className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">PDF</span>
                <span className="text-muted-foreground ml-auto">Includes frame</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Hidden render used for export capture */}
        <div className="absolute -left-[9999px] top-0 pointer-events-none">
          <div ref={previewRef}>
            <FramedPreview
              frame={design.frame ?? "none"}
              frameColor={design.frameColor || design.fgColor}
              frameText={design.frameText ?? "SCAN ME"}
              bgColor={design.bgColor || "#FFFFFF"}
            >
              <div ref={holderRef} style={{ width: size, height: size }} />
            </FramedPreview>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}