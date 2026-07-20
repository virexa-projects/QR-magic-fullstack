import { Types } from "mongoose";
import { QRCode } from "@models/QRCode.model";
import { FeedbackResponse, IFeedbackAnswer } from "@models/FeedbackResponse.model";
import { ApiError } from "@utils/ApiError";
import { QRType } from "@app-types/enums";

interface SubmitFeedbackInput {
  shortCode: string;
  answers: Array<{ questionId: string; value: string | number | boolean }>;
  respondentName?: string;
  respondentContact?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Validates submitted answers against the QR's own question definitions
 * (stored in QRCode.content.questions) — every `required` question must
 * have an answer present, and every answered questionId must actually
 * exist on the form. This is the response-side counterpart to
 * validateQrValue() on the frontend, which only validates the form
 * *definition* when the owner builds it, not what a scanner submits.
 */
export async function submitFeedback(input: SubmitFeedbackInput) {
  const qr = await QRCode.findOne({ shortCode: input.shortCode, status: "active" });
  if (!qr) throw ApiError.notFound("Feedback form not found");
  if (qr.type !== QRType.FEEDBACK) throw ApiError.badRequest("This QR code is not a feedback form");

  const questions = (qr.content?.questions ?? []) as Array<{ id: string; type: IFeedbackAnswer["type"]; required: boolean }>;
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const missingRequired = questions.filter(
    (q) => q.required && !input.answers.some((a) => a.questionId === q.id)
  );
  if (missingRequired.length > 0) {
    throw ApiError.badRequest(`Missing required answer(s) for: ${missingRequired.map((q) => q.id).join(", ")}`);
  }

  const answers: IFeedbackAnswer[] = input.answers
    .filter((a) => questionMap.has(a.questionId))
    .map((a) => ({
      questionId: a.questionId,
      type: questionMap.get(a.questionId)!.type,
      value: a.value,
    }));

  if (answers.length === 0) {
    throw ApiError.badRequest("No valid answers submitted");
  }

  if (!qr.content?.allowAnonymous && !input.respondentName?.trim()) {
    throw ApiError.badRequest("This form requires a name");
  }

  const response = await FeedbackResponse.create({
    qrCode: qr._id,
    owner: qr.owner,
    answers,
    respondentName: input.respondentName,
    respondentContact: input.respondentContact,
    ip: input.ip,
    userAgent: input.userAgent,
  });

  return response;
}

export async function listFeedback(
  ownerId: string,
  qrId: string,
  opts: { page: number; limit: number }
) {
  const qr = await QRCode.findById(qrId).select("owner type");
  if (!qr) throw ApiError.notFound("QR code not found");
  if (qr.owner.toString() !== ownerId) throw ApiError.forbidden("Access denied");
  if (qr.type !== QRType.FEEDBACK) throw ApiError.badRequest("This QR code is not a feedback form");

  const skip = (opts.page - 1) * opts.limit;
  const filter = { qrCode: new Types.ObjectId(qrId) };

  const [items, total] = await Promise.all([
    FeedbackResponse.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(opts.limit).lean(),
    FeedbackResponse.countDocuments(filter),
  ]);

  return { items, total, page: opts.page, limit: opts.limit, totalPages: Math.ceil(total / opts.limit) };
}

/** Quick aggregate for a dashboard summary card — average of any rating-type questions. */
export async function getFeedbackSummary(ownerId: string, qrId: string) {
  const qr = await QRCode.findById(qrId).select("owner type");
  if (!qr) throw ApiError.notFound("QR code not found");
  if (qr.owner.toString() !== ownerId) throw ApiError.forbidden("Access denied");

  const totalResponses = await FeedbackResponse.countDocuments({ qrCode: qrId });

  const ratingAgg = await FeedbackResponse.aggregate([
    { $match: { qrCode: new Types.ObjectId(qrId) } },
    { $unwind: "$answers" },
    { $match: { "answers.type": "rating" } },
    { $group: { _id: null, avgRating: { $avg: "$answers.value" }, count: { $sum: 1 } } },
  ]);

  return {
    totalResponses,
    averageRating: ratingAgg[0]?.avgRating ?? null,
    ratingCount: ratingAgg[0]?.count ?? 0,
  };
}