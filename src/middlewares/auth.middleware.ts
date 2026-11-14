/**
 * ============================================================================
 * [AUTHENTICATION MIDDLEWARE] - src/middlewares/auth.middleware.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Di PHP native (`session_start()`), status login dicek manual dengan:
 *    `if(!isset($_SESSION["login"])) { header("location: login.php"); exit; }`
 *    Jika programmer lupa menuliskan blok ini di salah satu file, halaman rahasia
 *    langsung bisa diakses oleh siapa saja.
 * 
 * 2. DESKRIPSI & FUNGSI (What it does):
 *    Middleware ini bertindak sebagai "Penjaga Pintu" (Gatekeeper) untuk endpoint private.
 *    Ia memeriksa apakah request membawa token JWT yang valid (dari HttpOnly cookie
 *    atau header Authorization). Jika valid, data user ditempelkan ke `req.user`.
 * 
 * 3. ALUR EKSEKUSI (Execution Flow):
 *    [STEP 1] -> Ambil token JWT dari `req.cookies.token` atau header `Authorization: Bearer <token>`.
 *    [STEP 2] -> Jika token tidak ada, tolak request dengan HTTP 401 Unauthorized.
 *    [STEP 3] -> Jika token ada, verifikasi tanda tangan digitalnya menggunakan `ENV.JWT_SECRET`.
 *    [STEP 4] -> Jika signature valid, ekstrak payload (id, username, role) dan simpan ke `req.user`.
 *    [STEP 5] -> Panggil `next()` untuk meneruskan request ke controller tujuan.
 *    [STEP 6] -> Jika token kadaluarsa atau dipalsukan, tangkap error dan tolak dengan HTTP 401.
 */

// [STEP 1: IMPORT DEPENDENCIES & TIPE DATA]
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

// 1.1. Definisikan bentuk data payload user yang disimpan di dalam token JWT
export interface AuthenticatedUser {
  id: string;
  username: string;
  role: "user" | "admin";
}

// 1.2. Perluas (extend) interface Request bawaan Express agar TypeScript mengenali properti `req.user`
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// [STEP 2: FUNGSI MIDDLEWARE REQUIRE_AUTH]
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 2.1. Ekstraksi token dari HttpOnly Cookie (prioritas utama) atau Header Authorization Bearer
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

  // [STEP 3: CEK KEBERADAAN TOKEN]
  if (!token) {
    res.status(401).json({
      success: false,
      message: "Autentikasi diperlukan. Silakan login terlebih dahulu.",
    });
    return;
  }

  // [STEP 4: VERIFIKASI TOKEN SECARA KRIPTOGRAFIS]
  try {
    // jwt.verify akan mendekripsi dan memverifikasi apakah token dibuat oleh server ini
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthenticatedUser;

    // [STEP 5: TEMPELKAN USER KE REQUEST OBJECT & TERUSKAN]
    // Controller berikutnya dapat langsung membaca `req.user.id` tanpa perlu query database lagi
    req.user = decoded;
    next();
  } catch (err) {
    // [STEP 6: TANGANI TOKEN KADALUARSA / PALSU]
    res.status(401).json({
      success: false,
      message: "Sesi login telah berakhir atau token tidak valid. Silakan login kembali.",
    });
  }
};
