import mongoose from "mongoose";

const projectVariableSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    ciphertext: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    authTag: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

projectVariableSchema.index({ projectId: 1, key: 1 }, { unique: true });

const ProjectVariable = mongoose.model("ProjectVariable", projectVariableSchema);

export { ProjectVariable };
