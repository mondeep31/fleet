import type { RequestHandler } from "express";
import { createUser, getUserById, updateUser } from "../services/user";
import type {
  CreateUserBody,
  UpdateUserBody,
  UserIdParams,
} from "../validators/user";

const createUserController: RequestHandler = async (req, res) => {
  const { name, email, password } = req.body as CreateUserBody;
  const user = await createUser({ name, email, password });
  res.status(201).json(user);
};

const getUserController: RequestHandler = async (req, res) => {
  const { id } = req.params as UserIdParams;
  const user = await getUserById({ id });
  res.status(200).json(user);
};

const updateUserController: RequestHandler = async (req, res) => {
  const { id } = req.params as UserIdParams;
  const { password } = req.body as UpdateUserBody;
  const user = await updateUser({ id, password });
  res.status(200).json(user);
};

export { createUserController, getUserController, updateUserController };
