import { useRef, useState } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Download, FileImage, FileCode, FileText as FilePdf } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import type { QRDesign } from "@/lib/mockData";

interface Props {
  value: string;
  design: QRDesign;
  filename: string;
  trigger: React.ReactNode;
}

const SIZES = [256, 512, 1024, 2048];

export default function DownloadPopover({ value, design, filename, trigger }: Props) {
  const [size, setSize] = useState(512);
  const hiddenRef = useRef<HTMLDivElement>(null);

  const safeName = filename.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "qrcode";

  const downloadPNG = () => {
    const canvas = hiddenRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return toast.error("Render failed");
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${safeName}-${size}.png`;
    a.click();
    toast.success(`Downloaded ${size}px PNG`);
  };

  const downloadSVG = () => {
    const svg = hiddenRef.current?.querySelector("svg") as SVGSVGElement | null;
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

  const downloadPDF = () => {
    const canvas = hiddenRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return toast.error("Render failed");
    const img = canvas.toDataURL("image/png");
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
  };

  return (
    <Popover>
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
                <span className="text-muted-foreground ml-auto">Best for web & print</span>
              </Button>
              <Button onClick={downloadSVG} variant="ghost" className="w-full h-9 justify-start gap-2 text-xs">
                <FileCode className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">SVG</span>
                <span className="text-muted-foreground ml-auto">Scalable, editable</span>
              </Button>
              <Button onClick={downloadPDF} variant="ghost" className="w-full h-9 justify-start gap-2 text-xs">
                <FilePdf className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">PDF</span>
                <span className="text-muted-foreground ml-auto">Ready to print</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Hidden render for export */}
        {/* Hidden render for export */}
        <div ref={hiddenRef} className="absolute -left-[9999px] top-0 pointer-events-none">
          <QRCodeCanvas
            value={value}
            size={size}
            fgColor={design.fgColor}
            bgColor={design.bgColor}
            level="H"
            includeMargin
            imageSettings={
              design.logo
                ? {
                  src: design.logo,
                  height: size * 0.2,   // ~20% of QR size, scales with the export size
                  width: size * 0.2,
                  excavate: true,
                  crossOrigin: "anonymous",
                }
                : undefined
            }
          />
          <QRCodeSVG
            value={value}
            size={size}
            fgColor={design.fgColor}
            bgColor={design.bgColor}
            level="H"
            includeMargin
            imageSettings={
              design.logo
                ? {
                  src: design.logo,
                  height: size * 0.2,
                  width: size * 0.2,
                  excavate: true,
                  crossOrigin: "anonymous",
                }
                : undefined
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
