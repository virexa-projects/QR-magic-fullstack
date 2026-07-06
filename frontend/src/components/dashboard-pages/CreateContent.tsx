import { useState, useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link as LinkIcon, Phone, Mail, MessageSquare, Wifi,
  User, MapPin, FileText, Download, Sparkles, RotateCcw, Copy, Check,
  ClipboardPaste, Eye, QrCode, Save, ArrowLeft, ArrowRight,
  Plus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PhonePreview from "@/components/PhonePreview";
import SocialPicker from "@/components/dashboard/SocialPicker";
import LabeledInputList from "@/components/dashboard/LabeledInputList";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

type QRType = "url" | "text" | "whatsapp" | "wifi" | "vcard" | "email" | "phone" | "sms" | "location";

const qrTypes: { id: QRType; label: string; icon: React.ElementType; desc: string; popular?: boolean }[] = [
  { id: "url", label: "Website", icon: LinkIcon, desc: "Link to any URL", popular: true },
  { id: "vcard", label: "vCard", icon: User, desc: "Digital business card", popular: true },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, desc: "Open chat instantly", popular: true },
  { id: "wifi", label: "Wi-Fi", icon: Wifi, desc: "One-tap connect" },
  { id: "text", label: "Text", icon: FileText, desc: "Plain text" },
  { id: "email", label: "Email", icon: Mail, desc: "Pre-filled message" },
  { id: "phone", label: "Phone", icon: Phone, desc: "Tap to call" },
  { id: "sms", label: "SMS", icon: MessageSquare, desc: "Pre-filled SMS" },
  { id: "location", label: "Location", icon: MapPin, desc: "GPS coordinates" },
];

const presetColors = [
  { fg: "#000000", bg: "#FFFFFF", name: "Classic" },
  { fg: "#000099", bg: "#FFFFFF", name: "Brand" },
  { fg: "#1a1a2e", bg: "#F5F5F5", name: "Slate" },
  { fg: "#0d9488", bg: "#FFFFFF", name: "Teal" },
  { fg: "#dc2626", bg: "#FFFFFF", name: "Red" },
  { fg: "#ea580c", bg: "#FFFFFF", name: "Orange" },
];

function smartDetect(text: string): { type: QRType; data: Record<string, string> } | null {
  const t = text.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) {
    const m = t.match(/wa\.me\/(\d+)/i);
    if (m) return { type: "whatsapp", data: { phone: `+${m[1]}` } };
    return { type: "url", data: { url: t } };
  }
  if (/^[\w.+-]+@[\w.-]+\.\w{2,}$/i.test(t)) return { type: "email", data: { email: t } };
  if (/^(\+?\d{1,4}[\s-]?)?\d{10,}$/.test(t.replace(/[\s()-]/g, ""))) return { type: "phone", data: { phone: t } };
  return { type: "text", data: { text: t } };
}

const STEPS = [
  { n: 1, label: "Type" },
  { n: 2, label: "Content" },
  { n: 3, label: "Design" },
];

function CreateInner() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<QRType>("url");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fgColor, setFgColor] = useState("#000099");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  // vCard digital-card appearance (separate from QR colors)
  const [cardBanner, setCardBanner] = useState("#000099");
  const [cardAccent, setCardAccent] = useState("#000099");
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<"preview" | "qr">("preview");
  const [qrName, setQrName] = useState("");
  const [isDynamic, setIsDynamic] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const getQRValue = useCallback((): string => {
    const d = formData;
    switch (selectedType) {
      case "url": return d.url || "https://example.com";
      case "text": return d.text || "Hello World";
      case "whatsapp": {
        const phone = (d.phone || "").replace(/\D/g, "");
        const msg = d.message ? `?text=${encodeURIComponent(d.message)}` : "";
        return `https://wa.me/${phone}${msg}`;
      }
      case "wifi": return `WIFI:T:${d.encryption || "WPA"};S:${d.ssid || ""};P:${d.password || ""};;`;
      case "vcard": {
        const phones = parseList(d.phones);
        const emails = parseList(d.emails);
        const socials = parseList(d.socials);
        const lines = [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `FN:${d.fullName || ""}`,
          `TITLE:${d.role || ""}`,
          `ORG:${d.company || ""}`,
          ...phones.map((p) => `TEL;TYPE=${(p.label || "CELL").toUpperCase()}:${p.value}`),
          ...emails.map((e) => `EMAIL;TYPE=${(e.label || "WORK").toUpperCase()}:${e.value}`),
          ...socials.map((s) => `URL;TYPE=${(s.label || "URL").toUpperCase()}:${s.value}`),
          "END:VCARD",
        ];
        return lines.join("\n");
      }
      case "email": return `mailto:${d.email || ""}?subject=${encodeURIComponent(d.subject || "")}&body=${encodeURIComponent(d.body || "")}`;
      case "phone": return `tel:${d.phone || ""}`;
      case "sms": return `sms:${d.phone || ""}?body=${encodeURIComponent(d.message || "")}`;
      case "location": return `geo:${d.latitude || "0"},${d.longitude || "0"}`;
      default: return "";
    }
  }, [selectedType, formData]);

  const setField = (k: string, v: string) => setFormData((p) => ({ ...p, [k]: v }));

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${qrName || `qrcode-${selectedType}`}.png`;
    a.click();
    toast.success("Downloaded");
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    });
  };

  const handleSave = () => {
    if (!qrName.trim()) return toast.error("Add a name first");
    toast.success(`Saved "${qrName}" to My QR Codes`);
  };

  const handleSmartPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const r = smartDetect(text);
      if (r) {
        setSelectedType(r.type);
        setFormData(r.data);
        setStep(2);
        toast.success(`Detected ${qrTypes.find(t => t.id === r.type)?.label}`);
      } else toast.error("Couldn't detect content");
    } catch {
      toast.error("Clipboard access denied");
    }
  };

  const renderField = (label: string, placeholder: string, field: string, type: string = "text") => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={formData[field] || ""}
        onChange={(e) => setField(field, e.target.value)}
        className="h-10 bg-background border-border"
      />
    </div>
  );

  const renderVCardFields = () => {
    const phones = parseList(formData.phones);
    const emails = parseList(formData.emails);
    const socials = parseList(formData.socials);
    return (
      <div className="space-y-5">
        {renderField("Full name", "Rahul Sharma", "fullName")}
        <div className="grid grid-cols-2 gap-3">
          {renderField("Job title / role", "Marketing Manager", "role")}
          {renderField("Company", "Your Company", "company")}
        </div>
        <LabeledInputList
          title="Phone numbers"
          addLabel="Add phone"
          items={phones}
          labels={["Mobile", "Work", "Home", "Other"]}
          placeholder="+91 98765 43210"
          type="tel"
          onChange={(items) => setField("phones", JSON.stringify(items))}
        />
        <LabeledInputList
          title="Email addresses"
          addLabel="Add email"
          items={emails}
          labels={["Work", "Personal", "Other"]}
          placeholder="rahul@example.com"
          type="email"
          onChange={(items) => setField("emails", JSON.stringify(items))}
        />
        <SocialPicker
          items={socials}
          onChange={(items) => setField("socials", JSON.stringify(items))}
        />

        {/* Card appearance */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-xs font-semibold text-foreground">Card appearance</Label>
            <span className="text-[10px] text-muted-foreground">How the digital card looks</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Header banner</Label>
              <div className="flex items-center gap-2 h-10 px-2 rounded-lg border border-border bg-background">
                <input type="color" value={cardBanner} onChange={(e) => setCardBanner(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
                <span className="text-[11px] font-mono text-foreground uppercase">{cardBanner}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Accent (buttons)</Label>
              <div className="flex items-center gap-2 h-10 px-2 rounded-lg border border-border bg-background">
                <input type="color" value={cardAccent} onChange={(e) => setCardAccent(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
                <span className="text-[11px] font-mono text-foreground uppercase">{cardAccent}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              { name: "Indigo",  banner: "#000099", accent: "#000099" },
              { name: "Lime",    banner: "#1a1a2e", accent: "#84cc16" },
              { name: "Slate",   banner: "#1a1a2e", accent: "#475569" },
              { name: "Sunset",  banner: "#dc2626", accent: "#ea580c" },
              { name: "Forest",  banner: "#0d5c3a", accent: "#10b981" },
              { name: "Ocean",   banner: "#0369a1", accent: "#0ea5e9" },
            ].map((p) => {
              const sel = cardBanner === p.banner && cardAccent === p.accent;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => { setCardBanner(p.banner); setCardAccent(p.accent); }}
                  title={p.name}
                  className={`h-7 px-2.5 rounded-md border text-[10px] font-medium flex items-center gap-1.5 transition ${sel ? "border-foreground bg-secondary" : "border-border bg-background hover:border-foreground/30"}`}
                >
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: p.banner }} />
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: p.accent }} />
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  const renderFields = () => {
    switch (selectedType) {
      case "url": return renderField("Website URL", "https://yourwebsite.com", "url", "url");
      case "text": return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Your text</Label>
          <Textarea placeholder="Enter text…" value={formData.text || ""} onChange={(e) => setField("text", e.target.value)} className="min-h-[110px]" />
        </div>
      );
      case "whatsapp": return (<>{renderField("Phone (with country code)", "+91 98765 43210", "phone")}{renderField("Pre-filled message (optional)", "Hi! Found you via QR", "message")}</>);
      case "wifi": return (<>{renderField("Network name (SSID)", "MyWiFi", "ssid")}{renderField("Password", "••••••••", "password", "password")}<div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">Encryption</Label><div className="flex gap-2">{["WPA", "WEP", "nopass"].map((enc) => (<button key={enc} onClick={() => setField("encryption", enc)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${(formData.encryption || "WPA") === enc ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-secondary/70"}`}>{enc === "nopass" ? "None" : enc}</button>))}</div></div></>);
      case "vcard": return renderVCardFields();
      case "email": return (<>{renderField("Email address", "hello@example.com", "email", "email")}{renderField("Subject", "Subject", "subject")}{renderField("Message", "Your message…", "body")}</>);
      case "phone": return renderField("Phone number", "+91 98765 43210", "phone");
      case "sms": return (<>{renderField("Phone number", "+91 98765 43210", "phone")}{renderField("Message", "Your message…", "message")}</>);
      case "location": return (<div className="grid grid-cols-2 gap-3">{renderField("Latitude", "28.6139", "latitude")}{renderField("Longitude", "77.2090", "longitude")}</div>);
      default: return null;
    }
  };

  // Force preview mode appropriately as user moves through steps
  const onNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) { setStep(3); setPreviewMode("qr"); }
  };
  const onBack = () => {
    if (step === 3) { setStep(2); setPreviewMode("preview"); }
    else if (step === 2) setStep(1);
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-20">
      {/* Header with stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground">Create a QR code</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Three steps. Live preview updates as you build.</p>
        </div>
        <Button onClick={handleSmartPaste} variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto border-lime/50 bg-lime-soft/40 hover:bg-lime-soft text-foreground">
          <ClipboardPaste className="w-3.5 h-3.5" /> Smart paste
        </Button>
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
                    active ? "bg-primary/10" : done ? "hover:bg-secondary cursor-pointer" : ""
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition ${
                    active ? "bg-primary text-primary-foreground" :
                    done ? "bg-lime text-lime-foreground" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : s.n}
                  </span>
                  <span className={`text-xs font-semibold ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px ${done ? "bg-lime" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        {/* LEFT — step content */}
        <div>
          <AnimatePresence mode="wait">
            {/* STEP 1 — choose type */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }} className="bg-card rounded-xl border border-border p-5">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-foreground">Pick a QR type</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">What should happen when someone scans?</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {qrTypes.map((t) => {
                    const Icon = t.icon;
                    const sel = selectedType === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => { setSelectedType(t.id); setFormData({}); }}
                        className={`relative text-left rounded-xl border p-3 transition-all ${
                          sel
                            ? "bg-primary/5 border-primary ring-1 ring-primary/30"
                            : "bg-background border-border hover:border-foreground/30"
                        }`}
                      >
                        {t.popular && !sel && (
                          <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-lime text-lime-foreground">
                            Popular
                          </span>
                        )}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${sel ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className={`text-sm font-semibold ${sel ? "text-primary" : "text-foreground"}`}>{t.label}</div>
                        <div className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug">{t.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2 — content */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }} className="space-y-4">
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-foreground">Add your content</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Watch the phone preview update as you type.</p>
                    </div>
                    <button onClick={() => setStep(1)} className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                      Change type
                    </button>
                  </div>
                  <div className="space-y-3">{renderFields()}</div>
                </div>

                <div className="bg-card rounded-xl border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Name this QR</h3>
                  <p className="text-[11px] text-muted-foreground mb-3">For your library — won't appear on the code.</p>
                  <Input placeholder="e.g. Diwali landing page" value={qrName} onChange={(e) => setQrName(e.target.value)} className="h-10" />
                </div>
              </motion.div>
            )}

            {/* STEP 3 — design */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }} className="space-y-4">
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="mb-4">
                    <h2 className="text-base font-bold text-foreground">Design your QR</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Pick colors that match your brand.</p>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Color preset</Label>
                      <div className="grid grid-cols-6 gap-2">
                        {presetColors.map((p) => {
                          const sel = fgColor === p.fg && bgColor === p.bg;
                          return (
                            <button
                              key={p.name}
                              onClick={() => { setFgColor(p.fg); setBgColor(p.bg); }}
                              title={p.name}
                              className={`aspect-square rounded-lg border-2 transition-all ${sel ? "border-foreground scale-95" : "border-border hover:border-foreground/30"}`}
                              style={{ background: `linear-gradient(135deg, ${p.fg} 50%, ${p.bg} 50%)` }}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Foreground</Label>
                        <div className="flex items-center gap-2 h-10 px-2 rounded-lg border border-border bg-background">
                          <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
                          <span className="text-xs font-mono text-foreground">{fgColor.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Background</Label>
                        <div className="flex items-center gap-2 h-10 px-2 rounded-lg border border-border bg-background">
                          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
                          <span className="text-xs font-mono text-foreground">{bgColor.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Save options</h3>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background cursor-pointer hover:border-foreground/30 transition mb-3">
                    <input type="checkbox" checked={isDynamic} onChange={(e) => setIsDynamic(e.target.checked)} className="mt-0.5 accent-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        Dynamic QR
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-lime text-lime-foreground font-semibold">PRO</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Edit destination later without reprinting. Tracks scans.</div>
                    </div>
                  </label>
                  <Button onClick={handleSave} className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                    <Save className="w-4 h-4 mr-2" /> Save to library
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step nav */}
          <div className="flex items-center justify-between mt-5">
            <Button variant="ghost" onClick={onBack} disabled={step === 1} className="gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            {step < 3 ? (
              <Button onClick={onNext} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-5">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-lime" /> Ready to download
              </div>
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
                <PhonePreview type={selectedType} data={formData} cardDesign={{ banner: cardBanner, accent: cardAccent }} />
              </motion.div>
            ) : (
              <motion.div key="qr" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.15 }} className="bg-card rounded-xl border border-border p-5">
                <div ref={canvasRef} className="flex items-center justify-center p-5 rounded-lg mb-4 border border-border" style={{ backgroundColor: bgColor }}>
                  <QRCodeCanvas value={getQRValue()} size={200} fgColor={fgColor} bgColor={bgColor} level="H" includeMargin />
                </div>
                <Button onClick={handleDownload} className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold mb-2">
                  <Download className="w-4 h-4 mr-2" /> Download PNG
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs h-9">
                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setFormData({}); setQrName(""); }} className="text-xs h-9">
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
    </div>
  );
}

// ============ helpers ============
type ListItem = { label: string; value: string };

function parseList(raw?: string): ListItem[] {
  if (!raw) return [];
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; }
}

export default function CreateContent() {
  return (
    <DashboardLayout>
      <CreateInner />
    </DashboardLayout>
  );
}
