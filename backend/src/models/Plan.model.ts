import { Schema, model, Document, Types } from "mongoose";

export interface IPlan extends Document {
  _id: Types.ObjectId;
  name: string; // e.g. Free, Starter, Pro, Business
  slug: string;
  price: number; // in smallest currency unit (paise)
  currency: string;
  durationDays: number;
  qrLimit: number; // -1 = unlimited
  dynamicQrLimit: number;
  scanLimitPerMonth: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    price: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "INR" },
    durationDays: { type: Number, required: true, default: 30 },
    qrLimit: { type: Number, required: true, default: 5 },
    dynamicQrLimit: { type: Number, required: true, default: 1 },
    scanLimitPerMonth: { type: Number, required: true, default: 1000 },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Plan = model<IPlan>("Plan", planSchema);
