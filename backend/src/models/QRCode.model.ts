import { Schema, model, Document, Types } from "mongoose";
import { QRType, QRStatus } from "@app-types/enums";

export { QRType, QRStatus };

export interface IQRDesign {
  fgColor: string;
  bgColor: string;
  eyeColor?: string;
  dotStyle: "square" | "rounded" | "dots";
  frame: "none" | "rounded" | "scan-me";
  logo?: string;
  bannerColor?: string;
  accentColor?: string;
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
  lastScanAt?: Date;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const designSchema = new Schema<IQRDesign>(
  {
    fgColor: { type: String, default: "#000000" },
    bgColor: { type: String, default: "#FFFFFF" },
    eyeColor: { type: String },
    dotStyle: { type: String, enum: ["square", "rounded", "dots"], default: "square" },
    frame: { type: String, enum: ["none", "rounded", "scan-me"], default: "none" },
    logo: { type: String },
    bannerColor: { type: String },
    accentColor: { type: String },
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
    lastScanAt: { type: Date },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index for the primary dashboard query pattern: "my QR codes, newest first"
qrCodeSchema.index({ owner: 1, createdAt: -1 });
qrCodeSchema.index({ owner: 1, status: 1 });

export const QRCode = model<IQRCode>("QRCode", qrCodeSchema);