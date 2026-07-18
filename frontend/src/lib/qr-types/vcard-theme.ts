// lib/qr-types/vcard-theme.ts
export interface VCardTheme {
  themeId: "indigo" | "lime" | "slate" | "sunset" | "forest" | "ocean" | "custom";
  bannerColor: string;
  accentColor: string;
  textColor: string;
  fontPair: "inter-inter" | "playfair-inter" | "poppins-poppins" | "spacegrotesk-inter";
  iconStyle: "outline" | "filled" | "duotone";
  avatarShape: "circle" | "rounded-square" | "square";
  /** Which of the 4 card layouts to render in the preview / landing page. */
  layout: "classic" | "split" | "minimal" | "banner";
}

// 6 named brand themes + a "Custom" slot the user can pick their own colors for.
// Banner/accent both default to #000099 (brand indigo) per the client's spec.
export const VCARD_THEMES: {
  id: VCardTheme["themeId"];
  label: string;
  banner: string;
  accent: string;
  swatch: string; // flat color/gradient used for the little picker chip
}[] = [
  { id: "indigo", label: "Indigo", banner: "#000099", accent: "#000099", swatch: "#000099" },
  { id: "lime", label: "Lime", banner: "#4d7c0f", accent: "#84cc16", swatch: "#84cc16" },
  { id: "slate", label: "Slate", banner: "#334155", accent: "#64748b", swatch: "#334155" },
  { id: "sunset", label: "Sunset", banner: "linear-gradient(135deg,#f97316,#db2777)", accent: "#f97316", swatch: "linear-gradient(135deg,#f97316,#db2777)" },
  { id: "forest", label: "Forest", banner: "#14532d", accent: "#16a34a", swatch: "#14532d" },
  { id: "ocean", label: "Ocean", banner: "#0c4a6e", accent: "#0ea5e9", swatch: "linear-gradient(135deg,#0c4a6e,#0ea5e9)" },
  { id: "custom", label: "Custom", banner: "#000099", accent: "#000099", swatch: "conic-gradient(from 90deg,#f97316,#db2777,#000099,#16a34a,#f97316)" },
];

export const VCARD_FONT_PAIRS: { id: VCardTheme["fontPair"]; label: string; heading: string; body: string }[] = [
  { id: "inter-inter", label: "Modern", heading: "Inter", body: "Inter" },
  { id: "playfair-inter", label: "Editorial", heading: "Playfair Display", body: "Inter" },
  { id: "poppins-poppins", label: "Friendly", heading: "Poppins", body: "Poppins" },
  { id: "spacegrotesk-inter", label: "Techy", heading: "Space Grotesk", body: "Inter" },
];

// The 4 preview / customer-facing card layouts.
export const VCARD_LAYOUTS: { id: VCardTheme["layout"]; label: string; description: string }[] = [
  { id: "classic", label: "Classic", description: "Banner + centered avatar overlap" },
  { id: "split", label: "Split", description: "Thin strip, left-aligned header" },
  { id: "minimal", label: "Minimal", description: "No banner, centered & clean" },
  { id: "banner", label: "Bold Banner", description: "Full-bleed color, name on banner" },
];
