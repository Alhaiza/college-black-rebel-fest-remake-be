/**
 * ============================================================================
 * [DATABASE CONNECTION] - src/config/db.ts
 * ============================================================================
 * Konsep untuk Developer PHP:
 * Di PHP native, Anda membuat koneksi database baru setiap kali file dijalankan
 * menggunakan `mysqli_connect("localhost", "root", "", "db")`.
 * 
 * Di Node.js, koneksi menggunakan "Connection Pool" yang persisten (tetap terbuka)
 * selama server Node.js aktif. Mongoose mengelola pool ini secara otomatis.
 */

// [STEP 1: IMPORT MONGOOSE & ENVIRONMENT CONFIG]
import mongoose from "mongoose";
import { ENV } from "./env.js";

/**
 * [STEP 2: DEFINISI FUNGSI ASYNC KONEKSI DATABASE DENGAN RESILIENCE]
 * Fungsi ini bertugas menginisialisasi koneksi awal serta menangani skenario
 * kegagalan jaringan (chaos engineering mitigation).
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    // 2.1. strictQuery: Memastikan hanya field yang terdaftar di Mongoose Schema yang bisa di-query
    // Mencegah eksploitasi query injection terselubung.
    mongoose.set("strictQuery", true);

    // 2.2. Eksekusi koneksi ke MongoDB URI
    // serverSelectionTimeoutMS: Batas waktu tunggu (5 detik) jika MongoDB down sebelum timeout.
    // autoIndex: Otomatis membuat indeks saat mode development, dinonaktifkan di production untuk performa.
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: ENV.NODE_ENV !== "production",
    });

    console.log("🚀 [Database] Berhasil terhubung ke MongoDB");
  } catch (error) {
    // [STEP 3: PENANGANAN KEGAGALAN KONEKSI AWAL]
    console.error("❌ [Database] Gagal terhubung ke MongoDB:", error);
    
    // Jika di production dan database tidak bisa dihubungi saat startup,
    // hentikan proses agar container orchestrator (Docker/K8s) me-restart instance.
    if (ENV.NODE_ENV === "production") {
      process.exit(1);
    }
  }

  // [STEP 4: EVENT LISTENER UNTUK DISKONEKSI RUNTIME]
  // Jika database tiba-tiba terputus saat aplikasi sedang berjalan (misal DB restart / network drop),
  // Mongoose akan otomatis mencoba reconnect di background, dan event ini akan mencatat log peringatannya.
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ [Database] Terputus dari MongoDB. Mencoba menyambung kembali...");
  });
};
