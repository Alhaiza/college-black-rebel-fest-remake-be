/**
 * ============================================================================
 * [DATABASE CONNECTION] - src/config/db.ts
 * ============================================================================
 * 
 * Konsep Serverless Connection Caching:
 * Di serverless (seperti Vercel), fungsi bisa dipanggil berulang-ulang
 * saat traffic masuk. Kita menyimpan cache koneksi Mongoose di memori global
 * agar tidak membuat koneksi baru ke MongoDB setiap kali ada request.
 */

import mongoose from "mongoose";
import { ENV } from "./env.js";

// Cache global untuk instance koneksi di serverless environment
let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  // Jika koneksi sudah aktif, pakai kembali koneksi yang ada (Re-use connection)
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: ENV.NODE_ENV !== "production",
    });
    isConnected = true;
    console.log("🚀 [Database] Berhasil terhubung ke MongoDB");
  } catch (error) {
    console.error("❌ [Database] Gagal terhubung ke MongoDB:", error);
    if (ENV.NODE_ENV === "production" && process.env.VERCEL !== "1") {
      process.exit(1);
    }
  }

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.warn("⚠️ [Database] Terputus dari MongoDB. Mencoba menyambung kembali...");
  });
};
