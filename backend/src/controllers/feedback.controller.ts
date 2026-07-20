import { Request, Response } from "express";
import { catchAsync } from "@utils/catchAsync";
import { sendSuccess } from "@utils/ApiResponse";
import { ApiError } from "@utils/ApiError";
import * as feedbackService from "@services/feedback.service";

/**
 * Public — no auth. Called from the /preview/:shortCode page's Submit
 * button when the QR type is "feedback".
 */
export const submit = catchAsync(async (req: Request, res: Response) => {
  const { shortCode } = req.params;
  const { answers, respondentName, respondentContact } = req.body;

  if (!Array.isArray(answers) || answers.length === 0) {
    throw ApiError.badRequest("At least one answer is required");
  }

  const response = await feedbackService.submitFeedback({
    shortCode,
    answers,
    respondentName,
    respondentContact,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendSuccess(res, 201, "Feedback submitted", { id: response._id });
});

/** Owner-only — dashboard list of responses for one feedback QR. */
export const list = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = Math.min(parseInt((req.query.limit as string) || "20", 10), 100);

  const result = await feedbackService.listFeedback(req.user.id, req.params.qrId, { page, limit });

  sendSuccess(res, 200, "Feedback responses fetched", result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

/** Owner-only — summary card (total responses, average rating). */
export const summary = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await feedbackService.getFeedbackSummary(req.user.id, req.params.qrId);
  sendSuccess(res, 200, "Feedback summary fetched", result);
});