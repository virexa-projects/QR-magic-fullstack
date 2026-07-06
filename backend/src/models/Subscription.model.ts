import { Schema, model, Document, Types } from "mongoose";
import { SubscriptionStatus } from "@app-types/enums";

export { SubscriptionStatus };

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  plan: Types.ObjectId;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  amount: number;
  currency: string;
  paymentGateway: "razorpay" | "stripe" | "manual";
  paymentId?: string;
  invoiceUrl?: string;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.PENDING,
      index: true,
    },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    paymentGateway: { type: String, enum: ["razorpay", "stripe", "manual"], default: "razorpay" },
    paymentId: { type: String },
    invoiceUrl: { type: String },
    autoRenew: { type: Boolean, default: false },
  },
  { timestamps: true }
);

subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });

export const Subscription = model<ISubscription>("Subscription", subscriptionSchema);
