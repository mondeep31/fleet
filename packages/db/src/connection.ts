import { getSharedEnv } from "@fleet/config";
import mongoose from "mongoose";

export async function connectDB() {
  const { MONGODB_URI } = getSharedEnv();

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
