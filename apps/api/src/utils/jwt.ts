import jwt from "jsonwebtoken";
import { AppError } from "../errors/app-error";

const JWT_EXPIRES = "7d";

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function signJWT(userId: string): string {
  return jwt.sign({ sub: userId }, getJWTSecret(), {
    expiresIn: JWT_EXPIRES,
  });
}

export function verifyJWT(token: string): { userId: string } {
  try {
    const payload = jwt.verify(token, getJWTSecret()) as { sub: string };
    return { userId: payload.sub };
  } catch (error) {
    throw new AppError(401, "Invalid token", "INVALID_TOKEN");
  }
}
