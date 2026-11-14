/**
 * ============================================================================
 * [ENVIRONMENT CONFIGURATION & SCHEMA VALIDATOR] - src/config/env.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Di PHP native lama, kredensial database ditulis langsung (hardcoded)
 *    di file PHP seperti `mysqli_connect("localhost", "root", "", "brf22")`.
 *    Ini berbahaya karena jika source code ter-push ke GitHub, password bocor.
 *    Selain itu, jika variabel environment di server salah ketik, aplikasi bisa
 *    crash di tengah jalan (runtime crash) saat user sedang transaksi.
 * 
 * 2. DESKRIPSI & FUNGSI (What it does):
 *    File ini memuat file `.env` menggunakan library `dotenv`, lalu memvalidasi
 *    dan mem-parse seluruh variabel menggunakan skema `Zod` secara ketat (fail-fast).
 *    Jika ada 1 saja variabel yang hilang atau salah tipe, server langsung menolak boot.
 * 
 * 3. ALUR EKSEKUSI (Execution Flow):
 *    [STEP 1] -> Load dotenv untuk membaca variabel dari file `.env` ke `process.env`.
 *    [STEP 2] -> Buat skema Zod (tipe data, format URL, panjang minimal, default value).
 *    [STEP 3] -> Validasi isi `process.env` dengan `envSchema.safeParse()`.
 *    [STEP 4] -> Jika validasi gagal, cetak pesan error spesifik dan matikan proses (`process.exit(1)`).
 *    [STEP 5] -> Jika validasi sukses, export konstanta `ENV` yang sudah bertipe data aman (Type-Safe).
 */

// [STEP 1: IMPORT LIBRARY & LOAD .ENV]
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// [STEP 2: DEFINISIKAN KONTRAK ATURAN VARIABEL ENVIRONMENT]
const envSchema = z.object({
  // NODE_ENV menentukan apakah aplikasi berjalan di mode development, production, atau test
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // PORT: Port tempat web server Express mendengarkan request (diubah dari string ke number)
  PORT: z.string().transform(Number).default(5000),

  // MONGODB_URI: Connection string ke database MongoDB (wajib ada, tidak boleh kosong)
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  // JWT_SECRET: Kunci enkripsi untuk menandatangani token login JWT (minimal 32 karakter agar kebal brute-force)
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  // JWT_EXPIRES_IN: Masa berlaku token JWT sebelum user otomatis logout (default 1 hari)
  JWT_EXPIRES_IN: z.string().default("1d"),

  // CORS_ORIGIN: Alamat frontend yang diizinkan mengakses API (mencegah request ilegal dari website luar)
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

// [STEP 3: LAKUKAN VALIDASI KETAT (FAIL-FAST)]
const parsed = envSchema.safeParse(process.env);

// [STEP 4: INTERSEPSI JIKA ADA KESALAHAN KONFIGURASI]
if (!parsed.success) {
  console.error(
    "❌ [FATAL CONFIG ERROR] Konfigurasi environment (.env) tidak valid:",
    JSON.stringify(parsed.error.format(), null, 2)
  );
  // Matikan server seketika agar tidak berjalan dengan konfigurasi cacat
  process.exit(1);
}

// [STEP 5: EXPORT KONSTANTA ENV SIAP PAKAI]
// Seluruh bagian aplikasi lain cukup mengimpor `ENV` tanpa perlu memanggil `process.env.NAMA_VAR` manual
export const ENV = parsed.data;
