// components/dashboard-pages/create/create.constants.ts
import type { QRDesign } from "@/lib/mockData";

export const PRESET_COLORS = [
  { fg: "#000000", bg: "#FFFFFF", name: "Classic" },
  { fg: "#000099", bg: "#FFFFFF", name: "Brand" },
  { fg: "#1a1a2e", bg: "#F5F5F5", name: "Slate" },
  { fg: "#0d9488", bg: "#FFFFFF", name: "Teal" },
  { fg: "#dc2626", bg: "#FFFFFF", name: "Red" },
  { fg: "#ea580c", bg: "#FFFFFF", name: "Orange" },
] as const;

export const STEPS = [
  { n: 1, label: "Type" },
  { n: 2, label: "Content" },
  { n: 3, label: "Create QR" },
] as const;

export const DEFAULT_QR_DESIGN: QRDesign = {
  fgColor: "#000099",
  bgColor: "#FFFFFF",
  eyeColor: "#000099",
  dotStyle: "rounded",
  frame: "none",
  useGradient: false,
  gradientColors: ["#000099", "#7c3aed"],
  gradientType: "linear",
  gradientRotation: 45,
  cornersSquareStyle: "extra-rounded",
  cornersDotStyle: "dot",
  frameColor: "#000099",
  frameText: "SCAN ME",
  logo: "",
  logoSize: 0.22,
  hideBackgroundDots: true,
  errorCorrectionLevel: "H",
};