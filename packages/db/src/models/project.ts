import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  projectId: {
    type: String,
    required: true,
    default: () => uuidv4(),
  },
  repoUrl: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  subdomain: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  branch: {
    type: String,
    required: true,
    default: "main",
  },
  runtime: {
    type: String,
  },
  status: {
    type: String,
    enum: ["active", "archived"],
    default: "active",
  },
  githubHookId: {
    type: Number,
  },
});

projectSchema.set("toJSON", {
  transform(_doc, ret) {
    const { __v: _version, ...safe } = ret;
    return safe;
  },
});

const Project = mongoose.model("Project", projectSchema);

export { Project };
