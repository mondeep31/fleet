import mongoose from "mongoose";

const domainSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Cloudflare for SaaS custom hostname ID — used for status polling and deletion.
    cloudflareHostnameId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "error", "deleted"],
      default: "pending",
    },
    sslStatus: {
      type: String,
    },
    // Raw ownership_verification / ownership_verification_http block from Cloudflare,
    // shown to the user as the DNS record they need to add.
    ownershipVerification: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Raw ssl.validation_records from Cloudflare (TXT DV challenge, one per
    // CA it attempts) — a separate record from ownershipVerification, needed
    // for the SSL certificate itself to be issued.
    sslValidationRecords: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    error: {
      type: String,
    },
    lastCheckedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const Domain = mongoose.model("Domain", domainSchema);

export { Domain };
