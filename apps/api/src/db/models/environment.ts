import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const environmentSchema = new mongoose.Schema(
  {
    environmentId: {
      type: String,
      required: true,
      default: () => uuidv4(),
    },
    projectId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      // prod, staging, dev
    },
    branch: {
      type: String,
      required: true,
    },
    subdomain: {
      type: String,
      required: true,
    },
    autoDeploy: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Environment = mongoose.model("Environment", environmentSchema);

export { Environment };
