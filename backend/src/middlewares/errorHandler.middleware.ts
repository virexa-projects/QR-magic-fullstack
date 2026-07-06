import { Request, Response, NextFunction } from "express";
import { ApiError } from "@utils/ApiError";
import { logger } from "@config/logger";
import { env } from "@config/env";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof Error) {
    // Mongoose duplicate key error
    if ((err as any).code === 11000) {
      apiError = ApiError.conflict("A record with these details already exists");
    } else if (err.name === "ValidationError") {
      apiError = ApiError.badRequest(err.message);
    } else if (err.name === "CastError") {
      apiError = ApiError.badRequest("Invalid identifier format");
    } else {
      apiError = ApiError.internal(env.isProd ? "Something went wrong" : err.message);
    }
  } else {
    apiError = ApiError.internal("Unknown error");
  }

  if (!apiError.isOperational) {
    logger.error(`[${req.requestId}] ${req.method} ${req.originalUrl} -> ${err}`);
  } else if (apiError.statusCode >= 500) {
    logger.error(`[${req.requestId}] ${apiError.message}`);
  } else {
    logger.debug(`[${req.requestId}] ${apiError.statusCode} ${apiError.message}`);
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    ...(apiError.details ? { errors: apiError.details } : {}),
    ...(env.isProd ? {} : { stack: err instanceof Error ? err.stack : undefined }),
  });
}
