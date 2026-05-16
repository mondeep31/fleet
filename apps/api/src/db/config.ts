import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.MONGODB_URI;

if (!dbUrl) {
  throw new Error("MONGODB_URI is not set");
}

export const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    throw error;
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
};
