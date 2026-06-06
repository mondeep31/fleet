import type { RequestHandler } from "express";
import { buildErrorResponse } from "@fleet/errors";

export const notFoundHandler: RequestHandler = (req, res) => {
  res
    .status(404)
    .json(
      buildErrorResponse(
        `Not found: ${req.method} ${req.originalUrl}`,
        "NOT_FOUND",
      ),
    );
};
