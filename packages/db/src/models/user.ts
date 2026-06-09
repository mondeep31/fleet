import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
    },
    authProvider: {
      type: String,
      enum: ["email", "github"],
      default: "email",
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true,
    },
    githubLogin: {
      type: String,
    },
    githubAvatarUrl: {
      type: String,
    },
    githubAccessToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.set("toJSON", {
  transform(_doc, ret) {
    const {
      password: _password,
      githubAccessToken: _githubAccessToken,
      __v: _version,
      ...safe
    } = ret;
    return safe;
  },
});

const User = mongoose.model("User", userSchema);

export { User };
