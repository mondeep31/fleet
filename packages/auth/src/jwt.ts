import { getEnv } from "@fleet/config";
import jwt from "jsonwebtoken";
import { AppError } from "@fleet/errors";

const JWT_EXPIRES = "7d";

function getJWTSecret(): string {
  return getEnv().JWT_SECRET;
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
  } catch {
    throw new AppError(401, "Invalid token", "INVALID_TOKEN");
  }
}
