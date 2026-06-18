import mongoose from "mongoose";

const integrationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      enum: ["github"],
      required: true,
    },
    // AES-256-GCM encrypted access token — same pattern as ProjectVariable.
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
    githubUserId: {
      type: String,
    },
    githubUsername: {
      type: String,
    },
    scopes: {
      type: [String],
      default: [],
    },
    // Which OAuth app issued the stored token — used for revocation on disconnect.
    oauthApp: {
      type: String,
      enum: ["login", "connect"],
      default: "connect",
    },
    connectedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
  },
);

integrationSchema.index({ userId: 1, provider: 1 }, { unique: true });

const Integration = mongoose.model("Integration", integrationSchema);

export { Integration };
