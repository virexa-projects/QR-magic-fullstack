import { Schema, model, Document, Types } from "mongoose";
import { QRType, QRStatus } from "@app-types/enums";

export { QRType, QRStatus };

export interface IQRDesign {
  fgColor: string;
  bgColor: string;
  eyeColor?: string;
  dotStyle: string; // Lift the rigid enum restrictor to accept all front-end types
  frame: string;
  logo?: string;
  useGradient?: boolean;
  gradientType?: "linear" | "radial";
  gradientColors?: string[];
  gradientRotation?: number;
  cornersSquareStyle?: string;
  cornersDotStyle?: string;
  frameColor?: string;
  frameText?: string;
  logoSize?: number;
  hideBackgroundDots?: boolean;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

export interface IQRCode extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  name: string;
  type: QRType;
  destination: string; // raw destination data (url, phone, wifi ssid, vcard fields JSON, etc.)
  content?: Record<string, any>; // structured per-type fields (used to repopulate edit forms)
  shortCode: string; // unique slug used in redirect URL for dynamic QRs
  shortUrl:string;
  isDynamic: boolean;
  status: QRStatus;
  design: IQRDesign;
  scansTotal: number;
  scansToday: number;
  scansTodayDate?: string | null;
  clicksTotal: number;      // NEW
  lastScanAt?: Date;
  lastClickAt?: Date;       // NEW
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const designSchema = new Schema<IQRDesign>(
  {
    fgColor: { type: String, default: "#000000" },
    bgColor: { type: String, default: "#FFFFFF" },
    eyeColor: { type: String },
    dotStyle: { type: String, default: "rounded" },
    frame: { type: String, default: "none" },
    logo: { type: String },
    useGradient: { type: Boolean, default: false },
    gradientType: { type: String, enum: ["linear", "radial"], default: "linear" },
    gradientColors: { type: [String], default: ["#000099", "#7c3aed"] },
    gradientRotation: { type: Number, default: 45 },
    cornersSquareStyle: { type: String, default: "extra-rounded" },
    cornersDotStyle: { type: String, default: "dot" },
    frameColor: { type: String },
    frameText: { type: String, default: "SCAN ME" },
    logoSize: { type: Number, default: 0.22 },
    hideBackgroundDots: { type: Boolean, default: true },
    errorCorrectionLevel: { type: String, enum: ["L", "M", "Q", "H"], default: "H" },
  },
  { _id: false }
);

const qrCodeSchema = new Schema<IQRCode>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    type: { type: String, enum: Object.values(QRType), required: true },
    destination: { type: String, required: true },
    content: { type: Schema.Types.Mixed, default: {} },
    shortCode: { type: String, required: true, unique: true, index: true },
    shortUrl: {
    type: String,
    required: true,
},
    isDynamic: { type: Boolean, default: true },
    status: { type: String, enum: Object.values(QRStatus), default: QRStatus.ACTIVE, index: true },
    design: { type: designSchema, default: () => ({}) },
    scansTotal: { type: Number, default: 0 },
    scansToday: { type: Number, default: 0 },
    scansTodayDate: { type: String, default: null },
    clicksTotal: { type: Number, default: 0 },   // NEW
    lastScanAt: { type: Date },
    lastClickAt: { type: Date },                 // NEW
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index for the primary dashboard query pattern: "my QR codes, newest first"
qrCodeSchema.index({ owner: 1, createdAt: -1 });
qrCodeSchema.index({ owner: 1, status: 1 });

export const QRCode = model<IQRCode>("QRCode", qrCodeSchema);