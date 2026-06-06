/// <reference path="./express.d.ts" />
import type { RequestHandler } from "express";
import { AppError } from "@fleet/errors";
import { verifyJWT } from "./jwt";

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Missing or invalid token", "UNAUTHORIZED");
  }
  const token = header.slice(7);
  req.user = verifyJWT(token);
  next();
};
