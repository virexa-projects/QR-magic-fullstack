import { Schema, model, Document, Types } from "mongoose";

export interface IFeedbackAnswer {
  questionId: string;
  type: "rating" | "text" | "yesno";
  value: string | number | boolean;
}

export interface IFeedbackResponse extends Document {
  _id: Types.ObjectId;
  qrCode: Types.ObjectId;
  owner: Types.ObjectId; // denormalized from the QR, so owner queries never need a join
  answers: IFeedbackAnswer[];
  respondentName?: string;
  respondentContact?: string;
  ip?: string;
  userAgent?: string;
  submittedAt: Date;
}

const answerSchema = new Schema<IFeedbackAnswer>(
  {
    questionId: { type: String, required: true },
    type: { type: String, enum: ["rating", "text", "yesno"], required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const feedbackResponseSchema = new Schema<IFeedbackResponse>({
  qrCode: { type: Schema.Types.ObjectId, ref: "QRCode", required: true, index: true },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  answers: { type: [answerSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
  respondentName: { type: String, trim: true, maxlength: 100 },
  respondentContact: { type: String, trim: true, maxlength: 150 },
  ip: { type: String },
  userAgent: { type: String },
  submittedAt: { type: Date, default: Date.now },
});

// Primary read pattern: "all responses for this QR, newest first"
feedbackResponseSchema.index({ qrCode: 1, submittedAt: -1 });

export const FeedbackResponse = model<IFeedbackResponse>("FeedbackResponse", feedbackResponseSchema);