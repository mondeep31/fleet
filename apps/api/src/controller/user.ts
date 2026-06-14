import type { RequestHandler } from "express";
import {
  createUser,
  getUserById,
  updateUser,
  loginUserByEmailAndPassword,
} from "../services/user";

import type {
  CreateUserBody,
  LoginBody,
  UpdateUserBody,
} from "../validators/user";

const createUserController: RequestHandler = async (req, res) => {
  const { name, email, password } = req.body as CreateUserBody;
  const user = await createUser({ name, email, password });
  res.status(201).json({
    message: "User created successfully",
    success: true,
    data: user,
  });
};

const getUserController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const user = await getUserById({ id: userId });
  res.status(200).json({
    message: "User fetched successfully",
    success: true,
    data: user,
  });
};

const updateUserController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const { currentPassword, newPassword } = req.body as UpdateUserBody;

  const user = await updateUser({ userId, currentPassword, newPassword });
  res.status(200).json({
    message: "User updated successfully",
    success: true,
    data: user,
  });
};

const loginController: RequestHandler = async (req, res) => {
  const { email, password } = req.body as LoginBody;
  const user = await loginUserByEmailAndPassword({ email, password });
  res.status(200).json({
    message: "User logged in successfully",
    success: true,
    data: user,
  });
};

export {
  createUserController,
  getUserController,
  updateUserController,
  loginController,
};
