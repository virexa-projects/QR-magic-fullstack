import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import type { QRDesign } from "@/lib/mockData";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: QRDesign;
  qrValue: string;
  qrName: string;
  onSave: (d: QRDesign) => void;
}

const PRESETS: { name: string; design: Partial<QRDesign> }[] = [
  { name: "Classic",  design: { fgColor: "#000000", bgColor: "#FFFFFF" } },
  { name: "Brand",    design: { fgColor: "#000099", bgColor: "#FFFFFF" } },
  { name: "Lime",     design: { fgColor: "#1a1a2e", bgColor: "#F4FBE0" } },
  { name: "Slate",    design: { fgColor: "#1a1a2e", bgColor: "#F5F5F5" } },
  { name: "Sunset",   design: { fgColor: "#dc2626", bgColor: "#FFF7ED" } },
  { name: "Forest",   design: { fgColor: "#0d5c3a", bgColor: "#F0FDF4" } },
];

export default function QRDesignDialog({ open, onOpenChange, initial, qrValue, qrName, onSave }: Props) {
  const [design, setDesign] = useState<QRDesign>(initial);

  useEffect(() => { if (open) setDesign(initial); }, [open, initial]);

  const update = <K extends keyof QRDesign>(k: K, v: QRDesign[K]) => setDesign((d) => ({ ...d, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-base font-bold">Customize design — {qrName}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-[1fr_280px] max-h-[70vh]">
          {/* Controls */}
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Presets */}
            <div>
              <Label className="text-xs font-semibold text-foreground mb-2 block">Quick presets</Label>
              <div className="grid grid-cols-6 gap-2">
                {PRESETS.map((p) => {
                  const sel = design.fgColor === p.design.fgColor && design.bgColor === p.design.bgColor;
                  return (
                    <button
                      key={p.name}
                      onClick={() => setDesign((d) => ({ ...d, ...p.design }))}
                      title={p.name}
                      className={`aspect-square rounded-lg border-2 transition ${sel ? "border-foreground scale-95" : "border-border hover:border-foreground/30"}`}
                      style={{ background: `linear-gradient(135deg, ${p.design.fgColor} 50%, ${p.design.bgColor} 50%)` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-3 gap-3">
              <ColorField label="Foreground" value={design.fgColor} onChange={(v) => update("fgColor", v)} />
              <ColorField label="Background" value={design.bgColor} onChange={(v) => update("bgColor", v)} />
              <ColorField
                label="Eye accent"
                value={design.eyeColor || design.fgColor}
                onChange={(v) => update("eyeColor", v)}
              />
            </div>

            {/* Dot style */}
            <div>
              <Label className="text-xs font-semibold text-foreground mb-2 block">Dot style</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["square", "rounded", "dots"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => update("dotStyle", s)}
                    className={`py-2.5 rounded-lg border text-xs font-medium capitalize transition ${
                      design.dotStyle === s
                        ? "bg-primary/5 border-primary text-primary ring-1 ring-primary/20"
                        : "bg-background border-border text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">Visual hint — exported QR uses high error correction for scanability.</p>
            </div>

            {/* Frame */}
            <div>
              <Label className="text-xs font-semibold text-foreground mb-2 block">Frame</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "none", label: "None" },
                  { id: "rounded", label: "Rounded" },
                  { id: "scan-me", label: "Scan me" },
                ] as const).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => update("frame", f.id)}
                    className={`py-2.5 rounded-lg border text-xs font-medium transition ${
                      design.frame === f.id
                        ? "bg-primary/5 border-primary text-primary ring-1 ring-primary/20"
                        : "bg-background border-border text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Logo */}
            <div>
              <Label className="text-xs font-semibold text-foreground mb-2 block">Center logo (optional)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => update("logo", r.result as string);
                    r.readAsDataURL(f);
                  }}
                  className="text-xs file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-secondary file:text-foreground file:text-xs file:font-medium hover:file:bg-secondary/70"
                />
                {design.logo && (
                  <Button variant="ghost" size="sm" onClick={() => update("logo", undefined)} className="text-xs h-8">
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-lime" /> Auto-padded to keep QR scannable.
              </p>
            </div>
          </div>

          {/* Live preview */}
          <div className="bg-secondary/30 border-l border-border p-6 flex flex-col items-center justify-center">
            <div
              className={`p-4 transition-all ${design.frame === "rounded" ? "rounded-2xl border-2 border-foreground" : design.frame === "scan-me" ? "rounded-2xl border-2 border-foreground" : ""}`}
              style={{ backgroundColor: design.bgColor }}
            >
              <div className="relative">
                <QRCodeCanvas
                  value={qrValue || "https://example.com"}
                  size={180}
                  fgColor={design.fgColor}
                  bgColor={design.bgColor}
                  level="H"
                  includeMargin={false}
                  imageSettings={design.logo ? { src: design.logo, height: 36, width: 36, excavate: true } : undefined}
                />
              </div>
              {design.frame === "scan-me" && (
                <div className="text-center mt-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: design.fgColor }}>
                  Scan me
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 text-center max-w-[200px]">
              Test on multiple devices before printing for best results.
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t border-border bg-card">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(design); onOpenChange(false); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Save design
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 h-10 px-2 rounded-lg border border-border bg-background">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
        />
        <span className="text-[11px] font-mono text-foreground uppercase">{value}</span>
      </div>
    </div>
  );
}
