import type { RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    message: `Not found: ${req.method} ${req.originalUrl}`,
    success: false,
    code: "NOT_FOUND",
    data: null,
  });
};
