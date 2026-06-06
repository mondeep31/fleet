import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const serverSchema = new mongoose.Schema(
  {
    serverId: {
      type: String,
      required: true,
      default: () => uuidv4(),
    },
    name: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    totalRam: {
      type: Number,
      required: true,
    },
    totalCpu: {
      type: Number,
      required: true,
    },
    agentToken: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

serverSchema.set("toJSON", {
  transform(_doc, ret) {
    const { __v: _version, agentToken: _agentToken, ...safe } = ret;
    return safe;
  },
});

const Server = mongoose.model("Server", serverSchema);

export { Server };
