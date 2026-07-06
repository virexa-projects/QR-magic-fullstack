import { Response } from "express";

interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  meta?: Meta
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data ?? null,
    ...(meta ? { meta } : {}),
  });
}
