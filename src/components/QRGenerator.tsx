import { useState, useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link, Phone, Mail, MessageSquare, Wifi, CreditCard,
  User, MapPin, FileText, Download, Palette, Sparkles,
  RotateCcw, Copy, Check, Zap, ClipboardPaste, Eye, QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import PhonePreview from "./PhonePreview";

type QRType = "url" | "text" | "whatsapp" | "upi" | "wifi" | "vcard" | "email" | "phone" | "sms" | "location";

interface QRTypeConfig {
  id: QRType;
  label: string;
  icon: React.ElementType;
  description: string;
  popular?: boolean;
}

const qrTypes: QRTypeConfig[] = [
  { id: "url", label: "URL", icon: Link, description: "Website link", popular: true },
  { id: "upi", label: "UPI", icon: CreditCard, description: "UPI Payment", popular: true },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, description: "WhatsApp message", popular: true },
  { id: "wifi", label: "Wi-Fi", icon: Wifi, description: "Wi-Fi network" },
  { id: "vcard", label: "vCard", icon: User, description: "Contact card" },
  { id: "text", label: "Text", icon: FileText, description: "Plain text" },
  { id: "email", label: "Email", icon: Mail, description: "Email address" },
  { id: "phone", label: "Phone", icon: Phone, description: "Phone number" },
  { id: "sms", label: "SMS", icon: MessageSquare, description: "SMS message" },
  { id: "location", label: "Location", icon: MapPin, description: "Map location" },
];

const presetColors = [
  { fg: "#000000", bg: "#FFFFFF", name: "Classic" },
  { fg: "#1a1a2e", bg: "#f0f0f0", name: "Midnight" },
  { fg: "#0d9488", bg: "#f0fdfa", name: "Teal" },
  { fg: "#7c3aed", bg: "#faf5ff", name: "Purple" },
  { fg: "#dc2626", bg: "#fff5f5", name: "Red" },
  { fg: "#ea580c", bg: "#fff7ed", name: "Orange" },
  { fg: "#2563eb", bg: "#eff6ff", name: "Blue" },
  { fg: "#059669", bg: "#ecfdf5", name: "Green" },
];

// Smart detect patterns
function smartDetect(text: string): { type: QRType; data: Record<string, string> } | null {
  const t = text.trim();
  if (!t) return null;

  // URL
  if (/^https?:\/\//i.test(t)) {
    // WhatsApp link
    if (/wa\.me\/(\d+)/i.test(t)) {
      const match = t.match(/wa\.me\/(\d+)/);
      const phone = match ? match[1] : "";
      return { type: "whatsapp", data: { phone: `+${phone}` } };
    }
    return { type: "url", data: { url: t } };
  }

  // UPI ID
  if (/^[\w.-]+@[\w]+$/i.test(t) && /@(upi|paytm|okhdfcbank|okicici|oksbi|ybl|ibl|axl)/i.test(t)) {
    return { type: "upi", data: { upiId: t } };
  }

  // Email
  if (/^[\w.+-]+@[\w.-]+\.\w{2,}$/i.test(t)) {
    return { type: "email", data: { email: t } };
  }

  // Phone (Indian or international)
  if (/^(\+?\d{1,4}[\s-]?)?\d{10,}$/.test(t.replace(/[\s()-]/g, ""))) {
    return { type: "phone", data: { phone: t } };
  }

  // Wi-Fi string
  if (/^WIFI:/i.test(t)) {
    const ssid = t.match(/S:([^;]*)/)?.[1] || "";
    const pass = t.match(/P:([^;]*)/)?.[1] || "";
    const enc = t.match(/T:([^;]*)/)?.[1] || "WPA";
    return { type: "wifi", data: { ssid, password: pass, encryption: enc } };
  }

  // Geo coordinates
  if (/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(t)) {
    const [lat, lng] = t.split(",").map(s => s.trim());
    return { type: "location", data: { latitude: lat, longitude: lng } };
  }

  // Default to text
  return { type: "text", data: { text: t } };
}

export default function QRGenerator() {
  const [selectedType, setSelectedType] = useState<QRType>("url");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<"preview" | "qr">("preview");
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
      case "upi": {
        const pa = d.upiId || "";
        const pn = d.name ? `&pn=${encodeURIComponent(d.name)}` : "";
        const am = d.amount ? `&am=${d.amount}` : "";
        const tn = d.note ? `&tn=${encodeURIComponent(d.note)}` : "";
        return `upi://pay?pa=${pa}${pn}${am}${tn}`;
      }
      case "wifi": {
        const ssid = d.ssid || "";
        const pass = d.password || "";
        const enc = d.encryption || "WPA";
        return `WIFI:T:${enc};S:${ssid};P:${pass};;`;
      }
      case "vcard":
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${d.fullName || ""}\nTEL:${d.phone || ""}\nEMAIL:${d.email || ""}\nORG:${d.company || ""}\nEND:VCARD`;
      case "email":
        return `mailto:${d.email || ""}?subject=${encodeURIComponent(d.subject || "")}&body=${encodeURIComponent(d.body || "")}`;
      case "phone": return `tel:${d.phone || ""}`;
      case "sms": return `sms:${d.phone || ""}?body=${encodeURIComponent(d.message || "")}`;
      case "location":
        return `geo:${d.latitude || "0"},${d.longitude || "0"}`;
      default: return "";
    }
  }, [selectedType, formData]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qrcode-${selectedType}.png`;
    a.click();
  };

  const handleDownloadSVG = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><image href="${url}" width="300" height="300"/></svg>`;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qrcode-${selectedType}.svg`;
    a.click();
  };

  const handleCopyToClipboard = async () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  };

  const handleReset = () => {
    setFormData({});
    setFgColor("#000000");
    setBgColor("#FFFFFF");
  };

  const handleSmartPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const result = smartDetect(text);
      if (result) {
        setSelectedType(result.type);
        setFormData(result.data);
        const typeLabel = qrTypes.find(t => t.id === result.type)?.label || result.type;
        toast.success(`Smart Detect: ${typeLabel}`, {
          description: `Detected as ${typeLabel} and auto-filled the fields.`,
        });
      } else {
        toast.error("Couldn't detect content type from clipboard.");
      }
    } catch {
      toast.error("Clipboard access denied. Please paste manually.");
    }
  };

  const applyPalette = (fg: string, bg: string) => {
    setFgColor(fg);
    setBgColor(bg);
  };

  const renderFormFields = () => {
    switch (selectedType) {
      case "url":
        return (
          <Field label="Website URL" placeholder="https://yourwebsite.com" field="url" type="url" />
        );
      case "text":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Your Text</Label>
            <Textarea
              placeholder="Enter your text here..."
              value={formData.text || ""}
              onChange={(e) => handleFieldChange("text", e.target.value)}
              className="min-h-[100px] bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20"
            />
          </div>
        );
      case "whatsapp":
        return (
          <>
            <Field label="Phone Number (with country code)" placeholder="+91 98765 43210" field="phone" />
            <Field label="Pre-filled Message (optional)" placeholder="Hi! I found you via QR code" field="message" />
          </>
        );
      case "upi":
        return (
          <>
            <Field label="UPI ID" placeholder="yourname@upi" field="upiId" />
            <Field label="Payee Name" placeholder="Your Business Name" field="name" />
            <Field label="Amount (optional)" placeholder="₹ 0.00" field="amount" type="number" />
            <Field label="Note (optional)" placeholder="Payment for..." field="note" />
          </>
        );
      case "wifi":
        return (
          <>
            <Field label="Network Name (SSID)" placeholder="MyWiFiNetwork" field="ssid" />
            <Field label="Password" placeholder="••••••••" field="password" type="password" />
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Encryption</Label>
              <div className="flex gap-2">
                {["WPA", "WEP", "nopass"].map((enc) => (
                  <button
                    key={enc}
                    onClick={() => handleFieldChange("encryption", enc)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      (formData.encryption || "WPA") === enc
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {enc === "nopass" ? "None" : enc}
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      case "vcard":
        return (
          <>
            <Field label="Full Name" placeholder="Rahul Sharma" field="fullName" />
            <Field label="Phone" placeholder="+91 98765 43210" field="phone" />
            <Field label="Email" placeholder="rahul@example.com" field="email" type="email" />
            <Field label="Company" placeholder="Your Company" field="company" />
          </>
        );
      case "email":
        return (
          <>
            <Field label="Email Address" placeholder="hello@example.com" field="email" type="email" />
            <Field label="Subject" placeholder="Subject line" field="subject" />
            <Field label="Message" placeholder="Your message..." field="body" />
          </>
        );
      case "phone":
        return <Field label="Phone Number" placeholder="+91 98765 43210" field="phone" />;
      case "sms":
        return (
          <>
            <Field label="Phone Number" placeholder="+91 98765 43210" field="phone" />
            <Field label="Message" placeholder="Your SMS message..." field="message" />
          </>
        );
      case "location":
        return (
          <>
            <Field label="Latitude" placeholder="28.6139" field="latitude" />
            <Field label="Longitude" placeholder="77.2090" field="longitude" />
          </>
        );
      default:
        return null;
    }
  };

  const Field = ({ label, placeholder, field, type = "text" }: { label: string; placeholder: string; field: string; type?: string }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={formData[field] || ""}
        onChange={(e) => handleFieldChange(field, e.target.value)}
        className="bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20"
      />
    </div>
  );

  return (
    <section id="generator" className="py-16 md:py-24">
      <div className="container max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Smart QR Generator
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-3">
            Create Your QR Code
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Choose a type, fill in details, customize colors — see a live preview of what users will experience.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr,320px] gap-8">
          {/* Left Panel - Config */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Smart Paste AI */}
            <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-2xl p-4 border border-primary/15">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Smart Paste</p>
                    <p className="text-xs text-muted-foreground">Paste any URL, phone, email, UPI ID — we auto-detect the type</p>
                  </div>
                </div>
                <Button
                  onClick={handleSmartPaste}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Paste & Detect
                </Button>
              </div>
            </div>

            {/* Type Selector */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <h3 className="text-lg font-semibold font-heading text-foreground mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
                Choose QR Type
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {qrTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => { setSelectedType(type.id); setFormData({}); }}
                      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-glow"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {type.popular && !isSelected && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-warning" />
                      )}
                      <Icon className="w-5 h-5" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Fields */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <h3 className="text-lg font-semibold font-heading text-foreground mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
                Enter Details
              </h3>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedType}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {renderFormFields()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Color Customization */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <h3 className="text-lg font-semibold font-heading text-foreground mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
                <Palette className="w-4 h-4" />
                Customize Style
              </h3>

              <Tabs defaultValue="presets" className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="presets" className="flex-1">Presets</TabsTrigger>
                  <TabsTrigger value="custom" className="flex-1">Custom</TabsTrigger>
                </TabsList>

                <TabsContent value="presets">
                  <div className="grid grid-cols-4 gap-2">
                    {presetColors.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => applyPalette(p.fg, p.bg)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all hover:scale-105 ${
                          fgColor === p.fg && bgColor === p.bg ? "border-primary ring-2 ring-primary/20" : "border-border/50"
                        }`}
                      >
                        <div className="flex gap-0.5">
                          <div className="w-5 h-5 rounded-full border border-border/30" style={{ background: p.fg }} />
                          <div className="w-5 h-5 rounded-full border border-border/30" style={{ background: p.bg }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="custom">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Foreground</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                        <Input value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="flex-1 text-sm font-mono bg-secondary/50" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Background</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                        <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 text-sm font-mono bg-secondary/50" />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>

          {/* Right Panel - Phone Preview + QR */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:sticky lg:top-8 h-fit space-y-4"
          >
            {/* Preview/QR Toggle */}
            <div className="flex bg-card rounded-xl p-1 border border-border/50 shadow-card">
              <button
                onClick={() => setPreviewMode("preview")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  previewMode === "preview"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
              <button
                onClick={() => setPreviewMode("qr")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  previewMode === "qr"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                QR Code
              </button>
            </div>

            <AnimatePresence mode="wait">
              {previewMode === "preview" ? (
                <motion.div
                  key="phone-preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-center py-4"
                >
                  <PhonePreview type={selectedType} data={formData} />
                </motion.div>
              ) : (
                <motion.div
                  key="qr-preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-card rounded-2xl p-6 shadow-elevated border border-border/50">
                    <div
                      ref={canvasRef}
                      className="flex items-center justify-center p-6 rounded-xl mb-6"
                      style={{ backgroundColor: bgColor }}
                    >
                      <QRCodeCanvas
                        value={getQRValue()}
                        size={200}
                        fgColor={fgColor}
                        bgColor={bgColor}
                        level="H"
                        includeMargin
                      />
                    </div>

                    <div className="space-y-3">
                      <Button onClick={handleDownloadPNG} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                        <Download className="w-4 h-4 mr-2" />
                        Download PNG
                      </Button>

                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" onClick={handleDownloadSVG} className="text-xs">
                          <Download className="w-3 h-3 mr-1" />
                          SVG
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCopyToClipboard} className="text-xs">
                          {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Reset
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border/30">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-primary shrink-0" />
                        <span>Level H — scannable even with 30% damage</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
