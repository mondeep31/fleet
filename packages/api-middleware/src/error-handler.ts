import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { isDuplicateKeyError } from "@fleet/db";
import { AppError, buildErrorResponse } from "@fleet/errors";

/**
 * Express error handling middleware.
 * Handles custom application errors, validation errors, and generic/unexpected errors.
 * All error responses are returned in a consistent JSON format.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json(buildErrorResponse(err.message, err.code ?? "APP_ERROR"));
  }

  if (err instanceof ZodError) {
    return res.status(400).json(
      buildErrorResponse(
        err.issues.map((issue) => issue.message).join(", "),
        "VALIDATION_ERROR",
      ),
    );
  }

  if (isDuplicateKeyError(err)) {
    return res
      .status(409)
      .json(buildErrorResponse("Resource already exists", "DUPLICATE_KEY"));
  }

  if (err.name === "ValidationError") {
    return res
      .status(400)
      .json(buildErrorResponse(err.message, "VALIDATION_ERROR"));
  }

  console.error(err);
  return res
    .status(500)
    .json(buildErrorResponse("Internal server error", "INTERNAL_SERVER_ERROR"));
};
