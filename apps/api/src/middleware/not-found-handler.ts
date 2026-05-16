import type { RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: `Not found: ${req.method} ${req.originalUrl}`,
      code: "NOT_FOUND",
    },
  });
};
