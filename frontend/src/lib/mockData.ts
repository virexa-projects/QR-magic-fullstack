// Realistic mock analytics for the demo dashboard.
import { format, subDays } from "date-fns";

// lib/mockData.ts
export interface QRDesign {
  fgColor: string;
  bgColor: string;
  eyeColor?: string;
  dotStyle: "square" | "rounded" | "dots" | "classy" | "classy-rounded" | "extra-rounded";
  frame: "none" | "rounded" | "scan-me" | "badge" | "pill-bottom" | "ribbon" | "polaroid" | "browser" | "ticket" | "neon-glow";
  logo?: string;

  useGradient?: boolean;
  gradientType?: "linear" | "radial";
  gradientColors?: [string, string];
  gradientRotation?: number;

  cornersSquareStyle?: "square" | "dot" | "extra-rounded";
  cornersDotStyle?: "square" | "dot";

  frameColor?: string;
  frameText?: string;

  logoSize?: number;
  hideBackgroundDots?: boolean;

  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

export interface QRItem {
  id: string;
  name: string;
  type: "url" | "whatsapp" | "wifi" | "vcard";
  destination: string;
  scans: number;
  scansToday: number;
  status: "active" | "paused";
  createdAt: string;
  isDynamic: boolean;
  design: QRDesign;
}

const defaultDesign: QRDesign = {
  fgColor: "#000099",
  bgColor: "#FFFFFF",
  dotStyle: "square",
  frame: "none",
};

export const mockQRs: QRItem[] = [
  { id: "qr_01", name: "Diwali Sale Landing", type: "url", destination: "https://shop.kiranastore.in/diwali", scans: 4287, scansToday: 142, status: "active", createdAt: "2026-03-12", isDynamic: true, design: { ...defaultDesign, fgColor: "#000099" } },
  { id: "qr_03", name: "Customer Support WA", type: "whatsapp", destination: "+91 98765 43210", scans: 1456, scansToday: 38, status: "active", createdAt: "2026-03-22", isDynamic: true, design: { ...defaultDesign, fgColor: "#075e54" } },
  { id: "qr_04", name: "Cafe Wi-Fi", type: "wifi", destination: "BrewHaus_Guest", scans: 892, scansToday: 24, status: "active", createdAt: "2026-01-15", isDynamic: false, design: { ...defaultDesign, fgColor: "#1a1a2e" } },
  { id: "qr_05", name: "Holi Campaign (Expired)", type: "url", destination: "https://shop.kiranastore.in/holi", scans: 6234, scansToday: 0, status: "paused", createdAt: "2026-02-28", isDynamic: true, design: { ...defaultDesign, fgColor: "#dc2626" } },
  { id: "qr_06", name: "Business Card — Rahul", type: "vcard", destination: "Rahul Sharma · CEO", scans: 312, scansToday: 4, status: "active", createdAt: "2025-12-05", isDynamic: false, design: { ...defaultDesign } },
];

// 30-day scans trend (realistic daily variation)
export const scansTrend = Array.from({ length: 30 }).map((_, i) => {
  const day = subDays(new Date(), 29 - i);
  const base = 450 + Math.sin(i / 4) * 120 + Math.random() * 180;
  const weekendBoost = [0, 6].includes(day.getDay()) ? 1.3 : 1;
  return {
    date: format(day, "MMM d"),
    scans: Math.round(base * weekendBoost),
    unique: Math.round(base * weekendBoost * 0.72),
  };
});

export const deviceBreakdown = [
  { name: "Android", value: 68, color: "hsl(240 100% 30%)" },
  { name: "iOS", value: 26, color: "hsl(235 95% 55%)" },
  { name: "Other", value: 6, color: "hsl(220 20% 80%)" },
];

export const locationBreakdown = [
  { city: "Mumbai", scans: 4821, pct: 28 },
  { city: "Delhi NCR", scans: 3942, pct: 23 },
  { city: "Bengaluru", scans: 2734, pct: 16 },
  { city: "Hyderabad", scans: 1892, pct: 11 },
  { city: "Pune", scans: 1456, pct: 8 },
  { city: "Chennai", scans: 1234, pct: 7 },
  { city: "Other", scans: 1213, pct: 7 },
];

export const hourlyHeatmap = Array.from({ length: 24 }).map((_, h) => ({
  hour: `${h.toString().padStart(2, "0")}:00`,
  scans: Math.round(
    h < 6 ? 20 + Math.random() * 30 :
    h < 11 ? 80 + Math.random() * 60 :
    h < 14 ? 180 + Math.random() * 80 :
    h < 18 ? 220 + Math.random() * 100 :
    h < 22 ? 280 + Math.random() * 120 :
    100 + Math.random() * 50
  ),
}));

export const summaryStats = {
  totalQRs: mockQRs.length,
  totalScans: mockQRs.reduce((s, q) => s + q.scans, 0),
  scansToday: mockQRs.reduce((s, q) => s + q.scansToday, 0),
  activeQRs: mockQRs.filter((q) => q.status === "active").length,
  weekChange: 18.4,
};
