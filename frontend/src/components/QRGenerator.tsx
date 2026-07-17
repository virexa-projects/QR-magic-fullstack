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
import CreateContent from "./dashboard-pages/CreateContent";

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
        <CreateContent/>
      </div>
    </section>
  );
}
