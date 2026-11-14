import mongoose from "mongoose";
import { ENV } from "./env.js";

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: ENV.NODE_ENV !== "production",
    });
    console.log("🚀 [Database] Connected successfully to MongoDB");
  } catch (error) {
    console.error("❌ [Database] Connection failed:", error);
    if (ENV.NODE_ENV === "production") {
      process.exit(1);
    }
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ [Database] Disconnected from MongoDB. Attempting reconnect...");
  });
};

