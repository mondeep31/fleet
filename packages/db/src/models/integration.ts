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
    // Which GitHub app issued the stored token — used for refresh and revocation.
    oauthApp: {
      type: String,
      enum: ["login", "connect", "app"],
      default: "connect",
    },
    // GitHub App user tokens expire; both tokens remain encrypted at rest.
    tokenExpiresAt: Date,
    refreshToken: {
      type: new mongoose.Schema(
        { ciphertext: String, iv: String, authTag: String },
        { _id: false },
      ),
    },
    refreshTokenExpiresAt: Date,
    tokenRefreshLockId: String,
    tokenRefreshLockUntil: Date,
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
