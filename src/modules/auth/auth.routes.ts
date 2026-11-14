/**
 * ============================================================================
 * [AUTH ROUTES] - src/modules/auth/auth.routes.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Di PHP lama, setiap aksi autentikasi memiliki file sendiri (`login.php`,
 *    `register.php`, `logout.php`). Di Express, kita menggunakan Router modular
 *    yang memetakan endpoint HTTP (POST/GET) ke controller yang bersangkutan.
 * 
 * 2. DESKRIPSI & FUNGSI (What it does):
 *    Mendefinisikan endpoint URL auth di bawah prefix `/api/v1/auth`:
 *    - POST `/register` -> Validasi data via Zod -> Controller `register`
 *    - POST `/login`    -> Validasi data via Zod -> Controller `login`
 *    - POST `/logout`   -> Controller `logout`
 *    - GET  `/me`       -> Middleware `requireAuth` -> Controller `me`
 */

import { Router } from "express";
import { register, login, logout, me } from "./auth.controller.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

export const authRouter = Router();

// [ENDPOINT 1]: Registrasi akun baru (dengan validasi skema register)
authRouter.post("/register", validateRequest(registerSchema), register);

// [ENDPOINT 2]: Login pengguna (dengan validasi skema login)
authRouter.post("/login", validateRequest(loginSchema), login);

// [ENDPOINT 3]: Logout pengguna (menghapus cookie)
authRouter.post("/logout", logout);

// [ENDPOINT 4]: Cek status login & profil (wajib lolos token verification)
authRouter.get("/me", requireAuth, me);
