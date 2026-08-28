import type { ErrorRequestHandler, RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../utils/AppError.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(404, "ROUTE_NOT_FOUND", `Route not found: ${request.method} ${request.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;

  if (error instanceof z.ZodError) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "The request failed validation.",
        details: error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred." },
  });
};