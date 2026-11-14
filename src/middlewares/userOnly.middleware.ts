/**
 * ============================================================================
 * [USER-ONLY RBAC MIDDLEWARE] - src/middlewares/userOnly.middleware.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Menjaga pemisahan peran (Separation of Roles):
 *    - Akun Administrator bertindak sebagai pengelola festival dan pemeriksa gerbang.
 *    - Administrator TIDAK BOLEH memesan tiket untuk mencegah konflik kepentingan,
 *      manipulasi kuota internal, atau pencampuran data pembeli dan pengelola.
 * 
 * 2. DESKRIPSI & FUNGSI (What it does):
 *    Memeriksa apakah `req.user.role === 'admin'`. Jika ya, menolak aksi pemesanan
 *    tiket dengan respons HTTP 403 Forbidden.
 */

import { Request, Response, NextFunction } from "express";

export const requireUserOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Autentikasi diperlukan. Silakan login terlebih dahulu.",
    });
    return;
  }

  // Jika akun adalah admin, cegah untuk memesan tiket
  if (req.user.role === "admin") {
    res.status(403).json({
      success: false,
      message: "Akun Administrator tidak diizinkan untuk memesan tiket festival. Silakan gunakan akun penonton (user reguler).",
    });
    return;
  }

  next();
};
