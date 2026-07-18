"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import QRCodeStyling from "qr-code-styling";
import { toPng } from "html-to-image"; // Import html-to-image
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Wand2, Shuffle, AlertTriangle, CheckCircle2, Zap, Download } from "lucide-react";
import type { QRDesign } from "@/lib/mockData";
import { calculateQrStrength, generateHarmoniousGradient, randomHex } from "@/lib/qrDesignUtils";
import {updateQr} from '@/store/slices/qrSlice'
import { useDispatch } from "react-redux";
interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: QRDesign;
  qrValue: string;
  qrName: string;
  onSave: (d: QRDesign, logoFile?: File | null) => void;
}

const PRESETS: { name: string; design: Partial<QRDesign> }[] = [
  { name: "Classic", design: { fgColor: "#000000", bgColor: "#FFFFFF", useGradient: false } },
  { name: "Brand", design: { fgColor: "#000099", bgColor: "#FFFFFF", useGradient: false } },
  { name: "Lime", design: { fgColor: "#1a1a2e", bgColor: "#F4FBE0", useGradient: false } },
  { name: "Slate", design: { fgColor: "#1a1a2e", bgColor: "#F5F5F5", useGradient: false } },
  { name: "Sunset", design: { fgColor: "#dc2626", bgColor: "#FFF7ED", useGradient: false } },
  { name: "Forest", design: { fgColor: "#0d5c3a", bgColor: "#F0FDF4", useGradient: false } },
];

const GRADIENT_PRESETS: [string, string][] = [
  ["#000099", "#7c3aed"],
  ["#0d9488", "#000099"],
  ["#dc2626", "#ea580c"],
  ["#059669", "#0ea5e9"],
  ["#7c3aed", "#dc2626"],
];

const DOT_STYLES = [
  { id: "square", label: "Square" },
  { id: "dots", label: "Dots" },
  { id: "rounded", label: "Rounded" },
  { id: "classy", label: "Classy" },
  { id: "classy-rounded", label: "Classy Rnd" },
  { id: "extra-rounded", label: "Extra Rnd" },
] as const;

const CORNER_SQUARE_STYLES = [
  { id: "square", label: "Square" },
  { id: "dot", label: "Dot" },
  { id: "extra-rounded", label: "Rounded" },
] as const;

const CORNER_DOT_STYLES = [
  { id: "square", label: "Square" },
  { id: "dot", label: "Dot" },
] as const;

const FRAME_STYLES = [
  { id: "none", label: "None" },
  { id: "rounded", label: "Rounded" },
  { id: "scan-me", label: "Scan Me" },
  { id: "badge", label: "Badge" },
  { id: "pill-bottom", label: "Pill" },
  { id: "ribbon", label: "Ribbon" },
  { id: "polaroid", label: "Polaroid" },
  { id: "browser", label: "Browser" },
  { id: "ticket", label: "Ticket" },
  { id: "neon-glow", label: "Neon Glow" },
] as const;

function withDefaults(d: QRDesign): Required<QRDesign> {
  return {
    fgColor: d.fgColor ?? "#000099",
    bgColor: d.bgColor ?? "#FFFFFF",
    eyeColor: d.eyeColor ?? d.fgColor ?? "#000099",
    dotStyle: d.dotStyle ?? "rounded",
    frame: d.frame ?? "none",
    logo: d.logo ?? "",
    useGradient: d.useGradient ?? false,
    gradientType: d.gradientType ?? "linear",
    gradientColors: d.gradientColors ?? ["#000099", "#7c3aed"],
    gradientRotation: d.gradientRotation ?? 45,
    cornersSquareStyle: d.cornersSquareStyle ?? "extra-rounded",
    cornersDotStyle: d.cornersDotStyle ?? "dot",
    frameColor: d.frameColor ?? d.fgColor ?? "#000099",
    frameText: d.frameText ?? "SCAN ME",
    logoSize: d.logoSize ?? 0.22,
    hideBackgroundDots: d.hideBackgroundDots ?? true,
    errorCorrectionLevel: d.errorCorrectionLevel ?? "H",
  };
}

export default function QRDesignDialog({ open, onOpenChange, initial, qrValue, qrName, onSave }: Props) {
  const dispatch = useDispatch();
  const [design, setDesign] = useState<QRDesign>(() => withDefaults(initial));
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [holderNode, setHolderNode] = useState<HTMLDivElement | null>(null);
  const holderRef = useCallback((node: HTMLDivElement | null) => setHolderNode(node), []);
  const qrInstanceRef = useRef<QRCodeStyling | null>(null);
  
  // Ref to capture the entire FramedPreview DOM node
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setDesign(withDefaults(initial));
      setLogoFile(null);
    } else {
      qrInstanceRef.current = null;
    }
  }, [open, initial]);

  const update = <K extends keyof QRDesign>(k: K, v: QRDesign[K]) => setDesign((d) => ({ ...d, [k]: v }));

  const buildOptions = () => {
    const d = withDefaults(design);
    return {
      width: 180,
      height: 180,
      type: "svg" as const,
      data: qrValue || "https://example.com",
      margin: 6,
      qrOptions: { errorCorrectionLevel: d.errorCorrectionLevel },
      dotsOptions: d.useGradient
        ? {
            type: d.dotStyle,
            gradient: {
              type: d.gradientType,
              rotation: (d.gradientRotation * Math.PI) / 180,
              colorStops: [
                { offset: 0, color: d.gradientColors[0] },
                { offset: 1, color: d.gradientColors[1] },
              ],
            },
          }
        : { type: d.dotStyle, color: d.fgColor },
      backgroundOptions: { color: d.bgColor },
      cornersSquareOptions: { type: d.cornersSquareStyle, color: d.eyeColor || d.fgColor },
      cornersDotOptions: { type: d.cornersDotStyle, color: d.eyeColor || d.fgColor },
      image: d.logo || undefined,
      imageOptions: {
        crossOrigin: "anonymous" as const,
        margin: 4,
        imageSize: d.logoSize,
        hideBackgroundDots: d.hideBackgroundDots,
      },
    };
  };

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
  }, [open, holderNode, design, qrValue]);

  const handleSave = () => {
    onSave(design, logoFile);
    onOpenChange(false);
  };

  // UPDATED: Capture and download the actual DOM element containing the Frame
  const handleDownloadPng = async () => {
    if (!previewRef.current) return;

    try {
      // Capture the element styling at high quality (devicePixelRatio scales up the resolution)
      const dataUrl = await toPng(previewRef.current, {
        quality: 1.0,
        pixelRatio: 3, // Multiplies resolution for crisp, high-res prints
        style: {
          transform: "scale(1)", // Reset any scale transforms during capture
        }
      });

      // Programmatic click trigger to download
      const link = document.createElement("a");
      link.download = qrName ? `${qrName.replace(/\s+/g, "-").toLowerCase()}-framed.png` : "qr-code-framed.png";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to generate QR Image with Frame:", error);
    }
  };

  const frame = design.frame ?? "none";
  const frameColor = design.frameColor || design.fgColor;
  const strength = calculateQrStrength(withDefaults(design));

  const applyAutoFix = () => {
    setDesign((d) => {
      const next = { ...d };
      if (d.logo) {
        next.logoSize = Math.min(d.logoSize ?? 0.22, 0.25);
        next.errorCorrectionLevel = "H";
      } else if ((d.errorCorrectionLevel ?? "H") === "L") {
        next.errorCorrectionLevel = "Q";
      }
      if (!d.useGradient) next.fgColor = d.fgColor === "#FFFFFF" ? "#000000" : d.fgColor;
      return next;
    });
  };

  const applyHarmoniousGradient = (mode: "analogous" | "complementary" | "triad") => {
    const base = design.useGradient ? design.gradientColors?.[0] ?? design.fgColor : design.fgColor;
    const pair = generateHarmoniousGradient(base, mode);
    setDesign((d) => ({ ...d, useGradient: true, gradientColors: pair }));
  };

  const surpriseMe = () => {
    const useGradient = Math.random() > 0.35;
    const base = randomHex();
    const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
    const dotOptions = DOT_STYLES.map((s) => s.id);
    const cornerSqOptions = CORNER_SQUARE_STYLES.map((s) => s.id);
    const cornerDotOptions = CORNER_DOT_STYLES.map((s) => s.id);
    const frameOptions = FRAME_STYLES.map((f) => f.id).filter((f) => f !== "none");

    setDesign((d) => ({
      ...d,
      fgColor: base,
      bgColor: "#FFFFFF",
      useGradient,
      gradientColors: useGradient ? generateHarmoniousGradient(base, pick(["analogous", "complementary", "triad"] as const)) : d.gradientColors,
      dotStyle: pick(dotOptions),
      cornersSquareStyle: pick(cornerSqOptions),
      cornersDotStyle: pick(cornerDotOptions),
      frame: pick(frameOptions) as QRDesign["frame"],
      frameColor: base,
      errorCorrectionLevel: d.logo ? "H" : "Q",
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-base font-bold">Customize design — {qrName}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-[1fr_300px] max-h-[72vh]">
          {/* Controls */}
          <div className="p-6 overflow-y-auto">
            <div className="mb-5">
              <Label className="text-xs font-semibold text-foreground mb-2 block">Quick presets</Label>
              <div className="grid grid-cols-6 gap-2">
                {PRESETS.map((p) => {
                  const sel = design.fgColor === p.design.fgColor && design.bgColor === p.design.bgColor && !design.useGradient;
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

            <Tabs defaultValue="color" className="w-full">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="color">Color</TabsTrigger>
                <TabsTrigger value="shape">Shape</TabsTrigger>
                <TabsTrigger value="frame">Frame</TabsTrigger>
                <TabsTrigger value="logo">Logo</TabsTrigger>
                <TabsTrigger value="ai" className="gap-1"><Zap className="w-3 h-3" /> AI</TabsTrigger>
              </TabsList>

              <TabsContent value="color" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Use gradient</Label>
                  <input type="checkbox" checked={!!design.useGradient} onChange={(e) => update("useGradient", e.target.checked)} className="accent-primary w-4 h-4" />
                </div>
                {!design.useGradient ? (
                  <div className="grid grid-cols-3 gap-3">
                    <ColorField label="Foreground" value={design.fgColor} onChange={(v) => update("fgColor", v)} />
                    <ColorField label="Background" value={design.bgColor} onChange={(v) => update("bgColor", v)} />
                    <ColorField label="Eye accent" value={design.eyeColor || design.fgColor} onChange={(v) => update("eyeColor", v)} />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <ColorField label="Gradient start" value={design.gradientColors?.[0] ?? "#000099"} onChange={(v) => update("gradientColors", [v, design.gradientColors?.[1] ?? "#7c3aed"])} />
                      <ColorField label="Gradient end" value={design.gradientColors?.[1] ?? "#7c3aed"} onChange={(v) => update("gradientColors", [design.gradientColors?.[0] ?? "#000099", v])} />
                    </div>
                    <div className="flex gap-2">
                      {(["linear", "radial"] as const).map((t) => (
                        <button key={t} onClick={() => update("gradientType", t)} className={`px-3 py-1.5 rounded-md text-xs font-medium border capitalize ${(design.gradientType ?? "linear") === t ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>{t}</button>
                      ))}
                    </div>
                    {(design.gradientType ?? "linear") === "linear" && (
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground">Rotation ({design.gradientRotation ?? 45}°)</Label>
                        <Slider min={0} max={360} step={5} value={[design.gradientRotation ?? 45]} onValueChange={([v]) => update("gradientRotation", v)} />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {GRADIENT_PRESETS.map(([a, b]) => (
                        <button key={a + b} onClick={() => update("gradientColors", [a, b])} className="w-8 h-8 rounded-md border border-border" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} />
                      ))}
                    </div>
                  </>
                )}
                <div className="pt-2 border-t border-border space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">Error correction (higher = more damage/logo tolerant)</Label>
                  <div className="flex gap-1.5">
                    {(["L", "M", "Q", "H"] as const).map((lvl) => (
                      <button key={lvl} onClick={() => update("errorCorrectionLevel", lvl)} className={`w-9 h-9 rounded-md text-xs font-bold border ${(design.errorCorrectionLevel ?? "H") === lvl ? "bg-foreground text-background border-foreground" : "border-border"}`}>{lvl}</button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="shape" className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-foreground mb-2 block">Dot style</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {DOT_STYLES.map((s) => (
                      <button key={s.id} onClick={() => update("dotStyle", s.id)} className={`py-2.5 rounded-lg border text-xs font-medium transition ${design.dotStyle === s.id ? "bg-primary/5 border-primary text-primary ring-1 ring-primary/20" : "bg-background border-border text-muted-foreground hover:border-foreground/30"}`}>{s.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-foreground mb-2 block">Corner square style</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {CORNER_SQUARE_STYLES.map((s) => (
                      <button key={s.id} onClick={() => update("cornersSquareStyle", s.id)} className={`py-2.5 rounded-lg border text-xs font-medium transition ${design.cornersSquareStyle === s.id ? "bg-primary/5 border-primary text-primary ring-1 ring-primary/20" : "bg-background border-border text-muted-foreground hover:border-foreground/30"}`}>{s.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-foreground mb-2 block">Corner dot style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {CORNER_DOT_STYLES.map((s) => (
                      <button key={s.id} onClick={() => update("cornersDotStyle", s.id)} className={`py-2.5 rounded-lg border text-xs font-medium transition ${design.cornersDotStyle === s.id ? "bg-primary/5 border-primary text-primary ring-1 ring-primary/20" : "bg-background border-border text-muted-foreground hover:border-foreground/30"}`}>{s.label}</button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="frame" className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {FRAME_STYLES.map((f) => (
                    <button key={f.id} onClick={() => update("frame", f.id)} className={`py-2.5 rounded-lg border text-xs font-medium transition ${design.frame === f.id ? "bg-primary/5 border-primary text-primary ring-1 ring-primary/20" : "bg-background border-border text-muted-foreground hover:border-foreground/30"}`}>{f.label}</button>
                  ))}
                </div>
                {frame !== "none" && (
                  <>
                    <ColorField label="Frame color" value={frameColor} onChange={(v) => update("frameColor", v)} />
                    {["scan-me", "badge", "pill-bottom", "ribbon", "ticket"].includes(frame) && (
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground">Frame text</Label>
                        <input value={design.frameText ?? "SCAN ME"} onChange={(e) => update("frameText", e.target.value.toUpperCase())} maxLength={20} className="w-full h-9 px-3 rounded-md border border-border bg-background text-xs" />
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="logo" className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setLogoFile(f);
                      const r = new FileReader();
                      r.onload = () => update("logo", r.result as string);
                      r.readAsDataURL(f);
                    }}
                    className="text-xs file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-secondary file:text-foreground file:text-xs file:font-medium hover:file:bg-secondary/70"
                  />
                  {design.logo && <Button variant="ghost" size="sm" onClick={() => { update("logo", undefined); setLogoFile(null); }}>Remove</Button>}
                </div>
                {design.logo && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Logo size ({Math.round((design.logoSize ?? 0.22) * 100)}%)</Label>
                      <Slider min={10} max={40} step={1} value={[(design.logoSize ?? 0.22) * 100]} onValueChange={([v]) => update("logoSize", v / 100)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Clear background behind logo</Label>
                      <input type="checkbox" checked={design.hideBackgroundDots ?? true} onChange={(e) => update("hideBackgroundDots", e.target.checked)} className="accent-primary w-4 h-4" />
                    </div>
                  </>
                )}
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-lime" /> Auto-padded to keep QR scannable. Use Q/H error correction with logos.
                </p>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <div className="rounded-xl border border-border p-4 bg-secondary/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">Scan strength</span>
                    <span className="text-xs font-bold" style={{ color: strength.color }}>{strength.label} · {strength.score}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${strength.score}%`, backgroundColor: strength.color }} />
                  </div>
                  {strength.issues.length > 0 ? (
                    <ul className="mt-3 space-y-1.5">
                      {strength.issues.map((issue, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-orange-500" /> {issue}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> No issues detected — great to print.
                    </div>
                  )}
                  {strength.issues.length > 0 && (
                    <Button size="sm" onClick={applyAutoFix} className="w-full mt-3 h-8 text-xs bg-foreground text-background hover:bg-foreground/90">
                      <Wand2 className="w-3.5 h-3.5 mr-1.5" /> Auto-fix issues
                    </Button>
                  )}
                </div>
                <div className="rounded-xl border border-border p-4">
                  <span className="text-xs font-semibold text-foreground mb-2 block">Smart gradient</span>
                  <p className="text-[11px] text-muted-foreground mb-2.5">Generate a harmonious second color from your current foreground.</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button onClick={() => applyHarmoniousGradient("analogous")} className="py-2 rounded-lg border border-border text-[11px] font-medium hover:border-foreground/30">Analogous</button>
                    <button onClick={() => applyHarmoniousGradient("complementary")} className="py-2 rounded-lg border border-border text-[11px] font-medium hover:border-foreground/30">Complementary</button>
                    <button onClick={() => applyHarmoniousGradient("triad")} className="py-2 rounded-lg border border-border text-[11px] font-medium hover:border-foreground/30">Triad</button>
                  </div>
                </div>
                <Button variant="outline" onClick={surpriseMe} className="w-full h-10 gap-2">
                  <Shuffle className="w-4 h-4" /> Surprise me
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live preview */}
          <div className="bg-secondary/30 border-l border-border p-6 flex flex-col items-center justify-center gap-4">
            {/* Added ref={previewRef} here to capture the entire wrapper */}
            <div ref={previewRef}>
              <FramedPreview frame={frame} frameColor={frameColor} frameText={design.frameText ?? "SCAN ME"} bgColor={design.bgColor}>
                <div ref={holderRef} style={{ width: 180, height: 180 }} />
              </FramedPreview>
            </div>

            <div className="w-full">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="font-semibold text-muted-foreground">Strength</span>
                <span className="font-bold" style={{ color: strength.color }}>{strength.label}</span>
              </div>
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${strength.score}%`, backgroundColor: strength.color }} />
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center max-w-[220px]">
              Test on multiple devices before printing for best results.
            </p>
          </div>
        </div>

        {/* Dialog Footer */}
        <DialogFooter className="px-6 py-3 border-t border-border bg-card flex justify-between items-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleDownloadPng} className="gap-2">
              <Download className="w-4 h-4" /> Download PNG
            </Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save design</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Frame renderer — STRUCTURALLY STABLE ----------------
function FramedPreview({
  frame, frameColor, frameText, bgColor, children,
}: { frame: string; frameColor: string; frameText: string; bgColor: string; children: React.ReactNode }) {
  const showTopBar = frame === "browser";
  const showBottomLabel = frame === "scan-me" || frame === "pill-bottom" || frame === "polaroid";
  const showBadgeLabel = frame === "badge";
  const showRibbon = frame === "ribbon";
  const showTicketStub = frame === "ticket";

  const outerClass =
    frame === "none" ? "inline-flex flex-col items-center" :
    frame === "polaroid" ? "inline-flex flex-col items-center bg-white p-3 pb-6 shadow-lg rotate-[-1deg]" :
    frame === "neon-glow" ? "inline-flex flex-col items-center rounded-2xl" :
    frame === "badge" ? "inline-flex flex-col items-center gap-2 p-4 rounded-3xl border-4" :
    "inline-flex flex-col items-center rounded-2xl overflow-hidden border-2";

  const outerStyle: React.CSSProperties =
    frame === "none" ? {} :
    frame === "polaroid" ? { boxShadow: "0 8px 20px rgba(0,0,0,0.15)" } :
    frame === "neon-glow" ? {
      border: `2px solid ${frameColor}`,
      boxShadow: `0 0 12px ${frameColor}99, 0 0 28px ${frameColor}55, inset 0 0 10px ${frameColor}33`,
    } :
    { borderColor: frameColor };

  const qrSlotClass =
    frame === "polaroid" ? "p-2" :
    frame === "ticket" ? "relative flex items-stretch border-2 border-dashed rounded-xl overflow-hidden" :
    frame === "ribbon" ? "relative p-4 rounded-xl border" :
    frame === "rounded" ? "p-4 rounded-2xl border-2" :
    "p-4";

  const qrSlotStyle: React.CSSProperties =
    frame === "ticket" || frame === "ribbon" || frame === "rounded"
      ? { borderColor: frameColor, backgroundColor: bgColor }
      : { backgroundColor: bgColor };

  return (
    <div className={outerClass} style={outerStyle}>
      {showTopBar && (
        <div className="w-full flex items-center gap-1.5 px-3 py-2" style={{ backgroundColor: frameColor }}>
          <span className="w-2.5 h-2.5 rounded-full bg-white/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/60" />
          <div className="ml-2 flex-1 h-4 rounded bg-white/25 text-[9px] text-white/90 flex items-center px-2 truncate">
            {frameText.toLowerCase()}
          </div>
        </div>
      )}

      <div className={qrSlotClass} style={qrSlotStyle}>
        {children}

        {showRibbon && (
          <div className="absolute -top-2 -right-2 px-3 py-1 text-[10px] font-bold text-white rounded-md shadow-md rotate-3" style={{ backgroundColor: frameColor }}>
            {frameText}
          </div>
        )}

        {showTicketStub && (
          <>
            <div className="flex items-center justify-center px-2 text-[10px] font-bold text-white tracking-widest" style={{ backgroundColor: frameColor, writingMode: "vertical-rl" }}>
              {frameText}
            </div>
            <div className="absolute left-[calc(100%-2.25rem)] top-0 bottom-0 flex flex-col justify-between py-1 pointer-events-none">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-background -ml-[3px]" />
              ))}
            </div>
          </>
        )}
      </div>

      {showBottomLabel && (
        <div
          className={frame === "polaroid" ? "mt-2 text-[11px] font-medium text-gray-700" : "w-full py-2 text-center text-[11px] font-bold tracking-widest uppercase"}
          style={frame === "polaroid" ? { fontFamily: "cursive" } : { backgroundColor: frameColor, color: "#fff" }}
        >
          {frameText}
        </div>
      )}

      {showBadgeLabel && (
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: frameColor }}>{frameText}</span>
      )}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 h-10 px-2 rounded-lg border border-border bg-background">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
        <span className="text-[11px] font-mono text-foreground uppercase">{value}</span>
      </div>
    </div>
  );
}