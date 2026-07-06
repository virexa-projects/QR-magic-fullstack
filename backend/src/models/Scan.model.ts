import { Schema, model, Document, Types } from "mongoose";
import { DeviceType } from "@app-types/enums";

export { DeviceType };

export interface IScan extends Document {
  _id: Types.ObjectId;
  qrCode: Types.ObjectId;
  owner: Types.ObjectId; // denormalized for fast owner-scoped analytics queries
  ip: string;
  userAgent: string;
  device: DeviceType;
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  city?: string;
  lat?: number;
  lng?: number;
  referrer?: string;
  scannedAt: Date;
}

const scanSchema = new Schema<IScan>(
  {
    qrCode: { type: Schema.Types.ObjectId, ref: "QRCode", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ip: { type: String, required: true },
    userAgent: { type: String },
    device: { type: String, enum: Object.values(DeviceType), default: DeviceType.OTHER },
    browser: { type: String },
    os: { type: String },
    country: { type: String, index: true },
    region: { type: String },
    city: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    referrer: { type: String },
    scannedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// Supports "scans for this QR over time" and "all scans for this user, recent first"
scanSchema.index({ qrCode: 1, scannedAt: -1 });
scanSchema.index({ owner: 1, scannedAt: -1 });

export const Scan = model<IScan>("Scan", scanSchema);
