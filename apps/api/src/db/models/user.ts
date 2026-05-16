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
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.set("toJSON", {
  transform(_doc, ret) {
    const { password: _password, __v: _version, ...safe } = ret;
    return safe;
  },
});

const User = mongoose.model("User", userSchema);

export default User;
