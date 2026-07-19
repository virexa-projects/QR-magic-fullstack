// components/dashboard-pages/create/create.types.ts
import type { QRDesign } from "@/lib/mockData";
import type { QrTypeId } from "@/lib/qr-types/schema";

export type PreviewMode = "preview" | "qr";
export type StepNumber = 1 | 2 | 3;

export interface SavedQr {
  name: string;
  type: QrTypeId;
  qrValue: string;
  fgColor: string;
  bgColor: string;
  isDynamic: boolean;
  shortUrl?: string;
  design?: QRDesign;
}