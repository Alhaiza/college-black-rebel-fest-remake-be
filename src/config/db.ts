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

// Cache global untuk promise koneksi di serverless environment
let cachedPromise: Promise<typeof mongoose> | null = null;

export const connectDatabase = async (): Promise<void> => {
  // Jika koneksi sudah aktif (readyState 1 = connected), gunakan langsung
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Jika sedang dalam proses menyambung, tunggu promise yang sama
  if (mongoose.connection.readyState === 2 && cachedPromise) {
    await cachedPromise;
    return;
  }

  try {
    mongoose.set("strictQuery", true);
    cachedPromise = mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false, // Matikan buffering agar jika koneksi putus tidak stuck 10 detik
      autoIndex: false,
    });
    await cachedPromise;
    console.log("🚀 [Database] Berhasil terhubung ke MongoDB Atlas");
  } catch (error) {
    cachedPromise = null;
    console.error("❌ [Database] Gagal terhubung ke MongoDB Atlas:", error);
    throw error;
  }
};
