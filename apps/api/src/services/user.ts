import User from "../db/models/user";
import bcrypt from "bcryptjs";
import { AppError } from "../errors/app-error";

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

export const createUser = async ({
  name,
  email,
  password,
}: CreateUserParams) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });
  return user;
};

export const getUserById = async ({ id }: GetUserByIdParams) => {
  const user = await User.findOne({ userId: id });
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }
  return user;
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
  return user;
};
