import { AppError } from "../errors/app-error";
import type { RequestHandler } from "express";
import { verifyJWT } from "../utils/jwt";

const authMiddleware: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Missing or invalid token", "UNAUTHORIZED");
  }
  const token = header.slice(7);
  req.user = verifyJWT(token);
  next();
};

export default authMiddleware;
