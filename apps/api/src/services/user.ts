import User from "../db/models/user";
import bcrypt from "bcryptjs";
import { AppError } from "../errors/app-error";
import { signJWT } from "../utils/jwt";

interface CreateUserParams {
  name: string;
  email: string;
  password: string;
}

interface GetUserByIdParams {
  id: string;
}

interface UpdateUserParams {
  id: string;
  password: string;
}

interface LoginUserByEmailAndPasswordParams {
  email: string;
  password: string;
}

export const createUser = async ({
  name,
  email,
  password,
}: CreateUserParams) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });
  return {
    id: user.userId,
    name: user.name,
    email: user.email,
  };
};

export const getUserById = async ({ id }: GetUserByIdParams) => {
  const user = await User.findOne({ userId: id });
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }
  return {
    id: user.userId,
    name: user.name,
    email: user.email,
  };
};

export const updateUser = async ({ id, password }: UpdateUserParams) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.findOneAndUpdate(
    { userId: id },
    { password: hashedPassword },
    { new: true },
  );
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }
  return {
    id: user.userId,
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
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(401, "Invalid password", "INVALID_PASSWORD");
  }
  const token = signJWT(user.userId);
  return {
    id: user.userId,
    name: user.name,
    email: user.email,
    token,
  };
};
