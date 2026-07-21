"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import QRCodeStyling from "qr-code-styling";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Wand2, Shuffle, AlertTriangle, CheckCircle2, Zap, Download } from "lucide-react";
import type { QRDesign } from "@/lib/mockData";
import { calculateQrStrength, generateHarmoniousGradient, randomHex } from "@/lib/qrDesignUtils";
import { toast } from "sonner";
import { useFilePreviewUrl } from "@/hooks/useFilePreviewUrl";
interface Step3QrProps {
  design: QRDesign;
  fgColor: string;
  setFgColor: (color: string) => void;
  bgColor: string;
  setBgColor: (color: string) => void;
  qrName: string;
  setQrName: (name: string) => void;
  isDynamic: boolean;
  setIsDynamic: (dynamic: boolean) => void;
  onSave: () => void;
  isLoading: boolean;
  presetColors: Array<{ fg: string; bg: string; name: string }>;
  qrValue?: string;
  onCancel?: () => void;
  setDesign: React.Dispatch<React.SetStateAction<QRDesign>>;
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

function withDefaults(d: Partial<QRDesign> | undefined): Required<QRDesign> {
  const safeD = d ?? {};
  return {
    fgColor: safeD.fgColor ?? "#000099",
    bgColor: safeD.bgColor ?? "#FFFFFF",
    eyeColor: safeD.eyeColor ?? safeD.fgColor ?? "#000099",
    dotStyle: safeD.dotStyle ?? "rounded",
    frame: safeD.frame ?? "none",
    logo: safeD.logo ?? "",
    useGradient: safeD.useGradient ?? false,
    gradientType: safeD.gradientType ?? "linear",
    gradientColors: safeD.gradientColors ?? ["#000099", "#7c3aed"],
    gradientRotation: safeD.gradientRotation ?? 45,
    cornersSquareStyle: safeD.cornersSquareStyle ?? "extra-rounded",
    cornersDotStyle: safeD.cornersDotStyle ?? "dot",
    frameColor: safeD.frameColor ?? safeD.fgColor ?? "#000099",
    frameText: safeD.frameText ?? "SCAN ME",
    logoSize: safeD.logoSize ?? 0.22,
    hideBackgroundDots: safeD.hideBackgroundDots ?? true,
    errorCorrectionLevel: safeD.errorCorrectionLevel ?? "H",
  };
}

export default function Step3Qr({
  design: initialDesign,
  fgColor,
  setFgColor,
  bgColor,
  setBgColor,
  qrName,
  setQrName,
  isDynamic,
  setIsDynamic,
  onSave,
  isLoading,
  presetColors,
  qrValue = "https://example.com",
  onCancel,
  setDesign,
}: Step3QrProps) {
  const [localDesign, setLocalDesign] = useState<QRDesign>(() => withDefaults(initialDesign));
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [holderNode, setHolderNode] = useState<HTMLDivElement | null>(null);
  const holderRef = useCallback((node: HTMLDivElement | null) => setHolderNode(node), []);
  const qrInstanceRef = useRef<QRCodeStyling | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const MAX_LOGO_SIZE_MB = 2;
  const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
  // Tracks the last design value that was synced between local <-> parent,
  // as a JSON fingerprint. Used by both sync effects below to tell the
  // difference between "a genuinely new design came from outside" and
  // "this is just an echo of the change I made a moment ago" — without
  // this, the two effects bounce updates back and forth forever because
  // withDefaults() always returns a fresh object/array reference even
  // when the actual values haven't changed.
  const lastSyncedRef = useRef<string>(JSON.stringify(withDefaults(initialDesign)));

  // Pull DOWN from parent — only when it's a real external change
  // (e.g. switching to edit a different saved QR), not our own echo.
  useEffect(() => {
    if (!initialDesign) return;
    const incoming = JSON.stringify(withDefaults(initialDesign));
    if (incoming !== lastSyncedRef.current) {
      lastSyncedRef.current = incoming;
      setLocalDesign(withDefaults(initialDesign));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDesign]);

  // Sync standalone global fg/bg color hooks down to local design payload
  useEffect(() => {
    if (fgColor && fgColor !== localDesign.fgColor) {
      setLocalDesign((prev) => ({ ...prev, fgColor }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fgColor]);

  useEffect(() => {
    if (bgColor && bgColor !== localDesign.bgColor) {
      setLocalDesign((prev) => ({ ...prev, bgColor }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgColor]);

  // Push UP to parent — records the fingerprint of what we just sent so
  // the "pull DOWN" effect above can recognize it as an echo and skip it.
  useEffect(() => {
    const serialized = JSON.stringify(localDesign);
    if (serialized !== lastSyncedRef.current) {
      lastSyncedRef.current = serialized;
      setDesign(localDesign);
    }
  }, [localDesign, setDesign]);

  const update = <K extends keyof QRDesign>(k: K, v: QRDesign[K]) => {
    setLocalDesign((d) => {
      const updated = { ...d, [k]: v };
      if (k === "fgColor" && typeof v === "string") setFgColor(v);
      if (k === "bgColor" && typeof v === "string") setBgColor(v);
      return updated;
    });
  };
const logoPreviewUrl = useFilePreviewUrl(localDesign.logo as any);
  const buildOptions = () => {
    const d = withDefaults(localDesign);
    return {
      width: 180,
      height: 180,
      type: "svg" as const,
      data: qrValue,
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
      image: logoPreviewUrl || undefined,
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
    if (!holderNode) return;
    if (!qrInstanceRef.current) {
      qrInstanceRef.current = new QRCodeStyling(buildOptions());
      qrInstanceRef.current.append(holderNode);
    } else {
      qrInstanceRef.current.update(buildOptions());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holderNode, localDesign, qrValue,logoPreviewUrl]);

  const handleDownloadPng = async () => {
    if (!previewRef.current) return;
    try {
      const dataUrl = await toPng(previewRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        style: { transform: "scale(1)" },
      });
      const link = document.createElement("a");
      link.download = qrName ? `${qrName.replace(/\s+/g, "-").toLowerCase()}-framed.png` : "qr-code-framed.png";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to generate QR Image with Frame:", error);
    }
  };

  const frame = localDesign.frame ?? "none";
  const frameColor = localDesign.frameColor || localDesign.fgColor;
  const strength = calculateQrStrength(withDefaults(localDesign));

  const applyAutoFix = () => {
    setLocalDesign((d) => {
      const next = { ...d };
      if (d.logo) {
        next.logoSize = Math.min(d.logoSize ?? 0.22, 0.25);
        next.errorCorrectionLevel = "H";
      } else if ((d.errorCorrectionLevel ?? "H") === "L") {
        next.errorCorrectionLevel = "Q";
      }
      if (!d.useGradient) {
        next.fgColor = d.fgColor === "#FFFFFF" ? "#000000" : d.fgColor;
        setFgColor(next.fgColor);
      }
      return next;
    });
  };

  const applyHarmoniousGradient = (mode: "analogous" | "complementary" | "triad") => {
    const base = localDesign.useGradient ? localDesign.gradientColors?.[0] ?? localDesign.fgColor : localDesign.fgColor;
    const pair = generateHarmoniousGradient(base, mode);
    setLocalDesign((d) => ({ ...d, useGradient: true, gradientColors: pair }));
  };

  const surpriseMe = () => {
    const useGradient = Math.random() > 0.35;
    const base = randomHex();
    const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
    const dotOptions = DOT_STYLES.map((s) => s.id);
    const cornerSqOptions = CORNER_SQUARE_STYLES.map((s) => s.id);
    const cornerDotOptions = CORNER_DOT_STYLES.map((s) => s.id);
    const frameOptions = FRAME_STYLES.map((f) => f.id).filter((f) => f !== "none");

    setFgColor(base);
    setLocalDesign((d) => ({
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
    <div className="w-full max-w-4xl border border-border rounded-xl bg-card overflow-hidden shadow-sm mx-auto">
      <div className="px-6 py-4 border-b border-border flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-foreground">Customize design</h2>
          <input
            type="text"
            value={qrName}
            onChange={(e) => setQrName(e.target.value)}
            className="text-xs bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none text-muted-foreground mt-0.5 w-48"
            placeholder="Name your QR code..."
          />
        </div>
        <div className="flex items-center gap-2 bg-secondary/40 px-3 py-1.5 rounded-lg border">
          <Label htmlFor="dynamic-toggle" className="text-xs cursor-pointer font-medium">Dynamic QR</Label>
          <input
            id="dynamic-toggle"
            type="checkbox"
            checked={isDynamic}
            onChange={(e) => setIsDynamic(e.target.checked)}
            className="accent-primary w-4 h-4 cursor-pointer"
          />
        </div>
      </div>

      <div className=" min-h-[500px]">
        <div className="p-6 overflow-y-auto">
          <div className="mb-5">
            <Label className="text-xs font-semibold text-foreground mb-2 block">Quick presets</Label>
            <div className="grid grid-cols-6 gap-2">
              {PRESETS.map((p) => {
                const sel = localDesign.fgColor === p.design.fgColor && localDesign.bgColor === p.design.bgColor && !localDesign.useGradient;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      if (p.design.fgColor) setFgColor(p.design.fgColor);
                      if (p.design.bgColor) setBgColor(p.design.bgColor);
                      setLocalDesign((d) => ({ ...d, ...p.design }));
                    }}
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
                <input type="checkbox" checked={!!localDesign.useGradient} onChange={(e) => update("useGradient", e.target.checked)} className="accent-primary w-4 h-4" />
              </div>
              {!localDesign.useGradient ? (
                <div className="grid grid-cols-3 gap-3">
                  <ColorField label="Foreground" value={localDesign.fgColor} onChange={(v) => update("fgColor", v)} />
                  <ColorField label="Background" value={localDesign.bgColor} onChange={(v) => update("bgColor", v)} />
                  <ColorField label="Eye accent" value={localDesign.eyeColor || localDesign.fgColor} onChange={(v) => update("eyeColor", v)} />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <ColorField label="Gradient start" value={localDesign.gradientColors?.[0] ?? "#000099"} onChange={(v) => update("gradientColors", [v, localDesign.gradientColors?.[1] ?? "#7c3aed"])} />
                    <ColorField label="Gradient end" value={localDesign.gradientColors?.[1] ?? "#7c3aed"} onChange={(v) => update("gradientColors", [localDesign.gradientColors?.[0] ?? "#000099", v])} />
                  </div>
                  <div className="flex gap-2">
                    {(["linear", "radial"] as const).map((t) => (
                      <button type="button" key={t} onClick={() => update("gradientType", t)} className={`px-3 py-1.5 rounded-md text-xs font-medium border capitalize ${(localDesign.gradientType ?? "linear") === t ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>{t}</button>
                    ))}
                  </div>
                  {(localDesign.gradientType ?? "linear") === "linear" && (
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Rotation ({localDesign.gradientRotation ?? 45}°)</Label>
                      <Slider min={0} max={360} step={5} value={[localDesign.gradientRotation ?? 45]} onValueChange={([v]) => update("gradientRotation", v)} />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {GRADIENT_PRESETS.map(([a, b]) => (
                      <button type="button" key={a + b} onClick={() => update("gradientColors", [a, b])} className="w-8 h-8 rounded-md border border-border" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} />
                    ))}
                  </div>
                </>
              )}
              <div className="pt-2 border-t border-border space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Error correction (higher = more damage/logo tolerant)</Label>
                <div className="flex gap-1.5">
                  {(["L", "M", "Q", "H"] as const).map((lvl) => (
                    <button type="button" key={lvl} onClick={() => update("errorCorrectionLevel", lvl)} className={`w-9 h-9 rounded-md text-xs font-bold border ${(localDesign.errorCorrectionLevel ?? "H") === lvl ? "bg-foreground text-background border-foreground" : "border-border"}`}>{lvl}</button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shape" className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-foreground mb-2 block">Dot style</Label>
                <div className="grid grid-cols-3 gap-2">
                  {DOT_STYLES.map((s) => (
                    <button type="button" key={s.id} onClick={() => update("dotStyle", s.id)} className={`py-2.5 rounded-lg border text-xs font-medium transition ${localDesign.dotStyle === s.id ? "bg-primary/5 border-primary text-primary ring-1 ring-primary/20" : "bg-background border-border text-muted-foreground hover:border-foreground/30"}`}>{s.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground mb-2 block">Corner square style</Label>
                <div className="grid grid-cols-3 gap-2">
                  {CORNER_SQUARE_STYLES.map((s) => (
                    <button type="button" key={s.id} onClick={() => update("cornersSquareStyle", s.id)} className={`py-2.5 rounded-lg border text-xs font-medium transition ${localDesign.cornersSquareStyle === s.id ? "bg-primary/5 border-primary text-primary ring-1 ring-primary/20" : "bg-background border-border text-muted-foreground hover:border-foreground/30"}`}>{s.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground mb-2 block">Corner dot style</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CORNER_DOT_STYLES.map((s) => (
                    <button type="button" key={s.id} onClick={() => update("cornersDotStyle", s.id)} className={`py-2.5 rounded-lg border text-xs font-medium transition ${localDesign.cornersDotStyle === s.id ? "bg-primary/5 border-primary text-primary ring-1 ring-primary/20" : "bg-background border-border text-muted-foreground hover:border-foreground/30"}`}>{s.label}</button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="frame" className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {FRAME_STYLES.map((f) => (
                  <button type="button" key={f.id} onClick={() => update("frame", f.id)} className={`py-2.5 rounded-lg border text-xs font-medium transition ${localDesign.frame === f.id ? "bg-primary/5 border-primary text-primary ring-1 ring-primary/20" : "bg-background border-border text-muted-foreground hover:border-foreground/30"}`}>{f.label}</button>
                ))}
              </div>
              {frame !== "none" && (
                <>
                  <ColorField label="Frame color" value={frameColor} onChange={(v) => update("frameColor", v)} />
                  {["scan-me", "badge", "pill-bottom", "ribbon", "ticket"].includes(frame) && (
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Frame text</Label>
                      <input value={localDesign.frameText ?? "SCAN ME"} onChange={(e) => update("frameText", e.target.value.toUpperCase())} maxLength={20} className="w-full h-9 px-3 rounded-md border border-border bg-background text-xs" />
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
                    e.target.value = "";
                    if (!f) return;

                    if (!ACCEPTED_LOGO_TYPES.includes(f.type)) {
                      toast.error(`Unsupported file type. Use PNG, JPEG, or SVG.`);
                      return;
                    }
                    if (f.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
                      toast.error(`"${f.name}" is too large (${(f.size / (1024 * 1024)).toFixed(1)}MB). Max ${MAX_LOGO_SIZE_MB}MB.`);
                      return;
                    }

                    setLogoFile(f);
                    update("logo", f as any); // raw File — uploaded to Cloudinary on save
                  }}
                  className="text-xs file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-secondary file:text-foreground file:text-xs file:font-medium hover:file:bg-secondary/70"
                />
                {localDesign.logo && (
                  <Button variant="ghost" size="sm" onClick={() => { update("logo", undefined); setLogoFile(null); }}>
                    Remove
                  </Button>
                )}
              </div>

              {logoFile && (
                <p className="text-[11px] text-muted-foreground -mt-1">
                  {logoFile.name} · {(logoFile.size / 1024).toFixed(0)}KB
                </p>
              )}

              {localDesign.logo && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground">Logo size ({Math.round((localDesign.logoSize ?? 0.22) * 100)}%)</Label>
                    <Slider min={10} max={40} step={1} value={[(localDesign.logoSize ?? 0.22) * 100]} onValueChange={([v]) => update("logoSize", v / 100)} />
                  </div>
                </>
              )}
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-lime-500" /> Auto-padded to keep QR scannable. Use Q/H error correction with logos.
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
                  <button type="button" onClick={() => applyHarmoniousGradient("analogous")} className="py-2 rounded-lg border border-border text-[11px] font-medium hover:border-foreground/30">Analogous</button>
                  <button type="button" onClick={() => applyHarmoniousGradient("complementary")} className="py-2 rounded-lg border border-border text-[11px] font-medium hover:border-foreground/30">Complementary</button>
                  <button type="button" onClick={() => applyHarmoniousGradient("triad")} className="py-2 rounded-lg border border-border text-[11px] font-medium hover:border-foreground/30">Triad</button>
                </div>
              </div>
              <Button type="button" variant="outline" onClick={surpriseMe} className="w-full h-10 gap-2">
                <Shuffle className="w-4 h-4" /> Surprise me
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 h-10 px-2 rounded-lg border border-border bg-background">
        <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0" />
        <span className="text-[11px] font-mono text-foreground uppercase truncate w-14">{value}</span>
      </div>
    </div>
  );
}