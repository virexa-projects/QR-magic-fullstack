// lib/qrDesignUtils.ts

// ---------- color math ----------
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const bigint = parseInt(full || "000000", 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relLuminance(hexToRgb(hex1));
  const l2 = relLuminance(hexToRgb(hex2));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

export function hexToHsl(hex: string): [number, number, number] {
  const [r0, g0, b0] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r0, g0, b0), min = Math.min(r0, g0, b0);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r0: h = (g0 - b0) / d + (g0 < b0 ? 6 : 0); break;
      case g0: h = (b0 - r0) / d + 2; break;
      default: h = (r0 - g0) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Generate a tasteful second gradient stop from a base color
export function generateHarmoniousGradient(baseHex: string, mode: "analogous" | "complementary" | "triad" = "analogous"): [string, string] {
  const [h, s, l] = hexToHsl(baseHex);
  const shift = mode === "complementary" ? 180 : mode === "triad" ? 120 : 35;
  const second = hslToHex(h + shift, Math.min(Math.max(s, 40), 90), Math.max(Math.min(l - 6, 80), 15));
  return [baseHex, second];
}

export function randomHex(): string {
  const h = Math.floor(Math.random() * 360);
  return hslToHex(h, 55 + Math.random() * 25, 30 + Math.random() * 15);
}

// ---------- QR strength scoring ----------
export interface QrDesignLike {
  fgColor: string;
  bgColor: string;
  useGradient?: boolean;
  gradientColors?: [string, string];
  dotStyle: string;
  logo?: string;
  logoSize?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

export interface StrengthResult {
  score: number; // 0-100
  label: "Excellent" | "Good" | "Risky" | "Poor";
  color: string;
  issues: string[];
}

export function calculateQrStrength(d: QrDesignLike): StrengthResult {
  let score = 100;
  const issues: string[] = [];

  const ec = d.errorCorrectionLevel ?? "H";
  const ecPenalty = { L: 25, M: 12, Q: 4, H: 0 }[ec];
  score -= ecPenalty;
  if (ec === "L" && d.logo) issues.push("Low error correction + logo is risky — switch to Q or H.");

  const primaryFg = d.useGradient ? d.gradientColors?.[0] ?? d.fgColor : d.fgColor;
  const contrast = contrastRatio(primaryFg, d.bgColor);
  if (contrast < 2.5) {
    score -= 35;
    issues.push("Very low contrast — this QR may fail to scan. Use a darker foreground or lighter background.");
  } else if (contrast < 4) {
    score -= 15;
    issues.push("Contrast is a bit low for reliable scanning in low light.");
  }

  if (d.logo) {
    const size = d.logoSize ?? 0.22;
    if (size > 0.32) {
      score -= 20;
      issues.push("Logo is too large — it may cover critical data modules.");
    } else if (size > 0.25) {
      score -= 8;
      issues.push("Logo is on the larger side — keep error correction at H.");
    }
    if (ec !== "H" && ec !== "Q") {
      score -= 10;
      issues.push("Add H or Q error correction whenever a logo is present.");
    }
  }

  if (d.useGradient && (d.dotStyle === "dots" || d.dotStyle === "classy")) {
    score -= 6;
    issues.push("Gradient + intricate dot style can confuse some older scanner apps.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const label: StrengthResult["label"] =
    score >= 85 ? "Excellent" : score >= 65 ? "Good" : score >= 40 ? "Risky" : "Poor";
  const color =
    score >= 85 ? "#059669" : score >= 65 ? "#65a30d" : score >= 40 ? "#ea580c" : "#dc2626";

  return { score, label, color, issues };
}