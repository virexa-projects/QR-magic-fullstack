import { Schema, model, Document, Types } from "mongoose";

export interface IAnalyticsDaily extends Document {
  _id: Types.ObjectId;
  qrCode: Types.ObjectId;
  owner: Types.ObjectId;
  date: string; // YYYY-MM-DD (UTC bucket)
  scans: number;
  uniqueIps: number;
  deviceBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
  hourlyBreakdown: number[]; // length 24
  createdAt: Date;
  updatedAt: Date;
}

const analyticsDailySchema = new Schema<IAnalyticsDaily>(
  {
    qrCode: { type: Schema.Types.ObjectId, ref: "QRCode", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true },
    scans: { type: Number, default: 0 },
    uniqueIps: { type: Number, default: 0 },
    deviceBreakdown: { type: Schema.Types.Mixed, default: {} },
    countryBreakdown: { type: Schema.Types.Mixed, default: {} },
    hourlyBreakdown: { type: [Number], default: () => new Array(24).fill(0) },
  },
  { timestamps: true }
);

// One rollup document per QR per day - upserted incrementally as scans arrive
analyticsDailySchema.index({ qrCode: 1, date: 1 }, { unique: true });
analyticsDailySchema.index({ owner: 1, date: 1 });

export const AnalyticsDaily = model<IAnalyticsDaily>("AnalyticsDaily", analyticsDailySchema);
