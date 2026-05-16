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
});

const Project = mongoose.model("Project", projectSchema);

export default Project;
