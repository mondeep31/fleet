import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error";
import { isDuplicateKeyError } from "../utils/mongo";

/**
 * Express error handling middleware.
 * Handles custom application errors, validation errors, and generic/unexpected errors.
 * All error responses are returned in a consistent JSON format.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // If the error is an AppError (custom application error), respond with its status code, message, and code.
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: err.issues.map((issue) => issue.message).join(", "),
        code: "VALIDATION_ERROR",
      },
    });
  }

  if (isDuplicateKeyError(err)) {
    return res.status(409).json({
      error: { message: "Resource already exists", code: "DUPLICATE_KEY" },
    });
  }

  // If the error is a validation error (common in ORMs like Mongoose),
  // return a 400 Bad Request with a generic "VALIDATION_ERROR" code.
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: { message: err.message, code: "VALIDATION_ERROR" },
    });
  }

  // For all other unexpected errors, log the error for debugging
  // and return a generic 500 Internal Server Error response.
  console.error(err);
  return res.status(500).json({
    error: { message: "Internal server error", code: "INTERNAL_SERVER_ERROR" },
  });
};
