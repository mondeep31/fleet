import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const deploymentSchema = new mongoose.Schema(
  {
    deploymentId: {
      type: String,
      required: true,
      default: () => uuidv4(),
    },
    projectId: {
      type: String,
      required: true,
    },
    environmentId: {
      type: String,
      required: true,
    },
    commitSha: {
      type: String,
      required: true,
    },
    commitMessage: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    serverId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "queued",
        "cloning",
        "cloned",
        "building",
        "deploying",
        "live",
        "failed",
        "rolled_back",
        "stopped",
      ],
    },
    logs: {
      type: [String],
      default: [],
    },
    clonePath: {
      type: String,
    },
    imageTag: {
      type: String,
    },
    url: {
      type: String,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

deploymentSchema.set("toJSON", {
  transform(_doc, ret) {
    const { __v: _version, ...safe } = ret;
    return safe;
  },
});

const Deployment = mongoose.model("Deployment", deploymentSchema);

export { Deployment };
