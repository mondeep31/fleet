import { User } from "@fleet/db";
import bcrypt from "bcryptjs";
import { signJWT } from "@fleet/auth";
import { enqueueEmail } from "@fleet/queue";
import { AppError } from "@fleet/errors";
import {
  createPasswordResetOtp,
  isPasswordResetOnCooldown,
  setPasswordResetCooldown,
  verifyPasswordResetOtp,
} from "../lib/password-reset";

interface CreateUserParams {
  name: string;
  email: string;
  password: string;
}

interface GetUserByIdParams {
  id: string;
}

interface GetUserPasswordParams {
  id: string;
}

interface UpdateUserParams {
  userId: string;
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface LoginUserByEmailAndPasswordParams {
  email: string;
  password: string;
}

interface ValidatePasswordForUpdateParams {
  currentPassword: string;
  newPassword: string;
  checkUser: string;
}

export const createUser = async ({
  name,
  email,
  password,
}: CreateUserParams) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(400, "User already exists", "USER_ALREADY_EXISTS");
  }
  const user = await User.create({ name, email, password: hashedPassword });
  await enqueueEmail({ type: "signup", to: user.email, name: user.name });
  const token = signJWT(user.userId);
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    token,
  };
};

export const getUserById = async ({ id }: GetUserByIdParams) => {
  const user = await User.findOne({ userId: id });
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    plan: user.plan ?? "free",
  };
};

export const updateUser = async ({
  userId,
  name,
  currentPassword,
  newPassword,
}: UpdateUserParams) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  if (newPassword) {
    if (currentPassword === newPassword) {
      throw new AppError(
        400,
        "New password cannot be the same as the current password",
        "INVALID_PASSWORD",
      );
    }
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword!,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new AppError(
        401,
        "Invalid current password",
        "INVALID_CURRENT_PASSWORD",
      );
    }
    user.password = await bcrypt.hash(newPassword, 10);
  }

  if (name !== undefined) {
    user.name = name;
  }

  await user.save();

  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
  };
};

export const requestPasswordReset = async ({ email }: { email: string }) => {
  if (await isPasswordResetOnCooldown(email)) {
    throw new AppError(429, "Too many requests. Wait a minute before requesting another code.", "RESET_COOLDOWN");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(404, "No account found for that email.", "USER_NOT_FOUND");
  }

  const code = await createPasswordResetOtp(email, user.userId);
  await enqueueEmail({ type: "password-reset", to: user.email, name: user.name, code });
  await setPasswordResetCooldown(email);
};

export const confirmPasswordReset = async ({
  email,
  code,
  newPassword,
}: {
  email: string;
  code: string;
  newPassword: string;
}) => {
  const result = await verifyPasswordResetOtp(email, code);

  if (!result.ok) {
    switch (result.reason) {
      case "expired":
        throw new AppError(400, "Reset code has expired. Request a new one.", "RESET_CODE_EXPIRED");
      case "locked":
        throw new AppError(400, "Too many failed attempts. Request a new code.", "RESET_CODE_LOCKED");
      case "invalid":
        throw new AppError(
          400,
          `Invalid code. ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? "" : "s"} remaining.`,
          "RESET_CODE_INVALID",
        );
      default: {
        const _: never = result;
        throw new AppError(400, "Invalid reset code.", "RESET_CODE_INVALID");
      }
    }
  }

  const user = await User.findOne({ userId: result.userId });
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
};

export const loginUserByEmailAndPassword = async ({
  email,
  password,
}: LoginUserByEmailAndPasswordParams) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(401, "Invalid password", "INVALID_PASSWORD");
  }
  await enqueueEmail({ type: "login", to: user.email, name: user.name });
  const token = signJWT(user.userId);
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    token,
  };
};
