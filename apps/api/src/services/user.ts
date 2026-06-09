import { User } from "@fleet/db";
import bcrypt from "bcryptjs";
import { signJWT } from "@fleet/auth";
import { AppError } from "@fleet/errors";

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
  currentPassword: string;
  newPassword: string;
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
  };
};

export const updateUser = async ({
  userId,
  currentPassword,
  newPassword,
}: UpdateUserParams) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  if (currentPassword === newPassword) {
    throw new AppError(
      400,
      "New password cannot be the same as the current password",
      "INVALID_PASSWORD",
    );
  }
  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
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

  await user.save();

  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
  };
};

export const loginUserByEmailAndPassword = async ({
  email,
  password,
}: LoginUserByEmailAndPasswordParams) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }
  if (!user.password) {
    throw new AppError(
      401,
      "This account uses GitHub sign in",
      "GITHUB_AUTH_REQUIRED",
    );
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(401, "Invalid password", "INVALID_PASSWORD");
  }
  const token = signJWT(user.userId);
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    token,
  };
};
