/**
 * ============================================================================
 * [CENTRALIZED ERROR HANDLER] - src/middlewares/error.middleware.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Di PHP native lama, jika query gagal, aplikasi mengeksekusi `echo mysqli_error($conn)`.
 *    Hal ini sangat berbahaya karena membocorkan nama tabel, database, dan struktur query ke publik.
 *    Selain itu, server bisa mencetak HTML fatal error yang merusak respons JSON.
 * 
 * 2. DESKRIPSI & FUNGSI (What it does):
 *    Ini adalah middleware terakhir di Express pipeline (memiliki 4 argumen: `err, req, res, next`).
 *    Ia menangkap semua jenis error yang dilempar oleh controller atau middleware lain,
 *    mengklasifikasikan tipe error-nya (Zod validation, Mongoose duplicate key, atau server bug),
 *    dan mengembalikan respons JSON yang seragam, bersih, dan aman.
 * 
 * 3. ALUR EKSEKUSI (Execution Flow):
 *    [STEP 1] -> Log error internal ke terminal backend untuk keperluan debugging developer.
 *    [STEP 2] -> Cek apakah error berasal dari validasi `ZodError`?
 *                -> Jika ya, respons HTTP 400 Bad Request dengan daftar field yang tidak valid.
 *    [STEP 3] -> Cek apakah error berasal dari Mongoose Duplicate Key (Kode 11000)?
 *                -> Jika ya, respons HTTP 409 Conflict (misal: "username already exists").
 *    [STEP 4] -> Untuk error lainnya, ambil status code kustom atau default ke HTTP 500 (Internal Server Error).
 *    [STEP 5] -> Kirimkan payload JSON standar `{ success: false, message: ... }`.
 */

// [STEP 1: IMPORT DEPENDENCIES DARI EXPRESS & ZOD]
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

// [STEP 2: DEFINISI MIDDLEWARE 4 PARAMETER]
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 2.1. Catat detail error di konsol backend agar programmer bisa melacak stack trace
  console.error("❌ [Global Error Handler]:", err);

  // [STEP 3: PENANGANAN KHUSUS VALIDASI GAGAL (ZOD ERROR)]
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validasi data gagal",
      errors: err.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // [STEP 4: PENANGANAN KHUSUS DUPLICATE KEY MONGOOSE (E11000)]
  // Terjadi jika user mendaftarkan username/email yang sudah ada di database
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "Data";
    res.status(409).json({
      success: false,
      message: `${field} sudah terdaftar di sistem.`,
    });
    return;
  }

  // [STEP 5: PENANGANAN ERROR UMUM / SERVER CRASH]
  const statusCode = err.statusCode || 500;
  const message = err.message || "Terjadi kesalahan internal pada server";

  res.status(statusCode).json({
    success: false,
    message,
  });
};
