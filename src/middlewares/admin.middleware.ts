/**
 * ============================================================================
 * [ADMIN RBAC MIDDLEWARE] - src/middlewares/admin.middleware.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Mencegah user biasa atau hacker mengakses endpoint administratif
 *    seperti restock kuota tiket, melihat total omzet festival, atau
 *    memvalidasi tiket di gerbang masuk.
 * 
 * 2. DESKRIPSI & FUNGSI (What it does):
 *    Mengevaluasi claim `role` dari token JWT yang sudah diverifikasi oleh `requireAuth`.
 *    Jika `req.user.role !== 'admin'`, request langsung ditolak dengan status HTTP 403 Forbidden.
 * 
 * 3. ALUR EKSEKUSI (Execution Flow):
 *    [STEP 1] -> Periksa apakah `req.user` sudah terisi oleh `requireAuth`.
 *    [STEP 2] -> Evaluasi apakah `req.user.role === 'admin'`.
 *    [STEP 3] -> Jika bukan admin, catat log audit keamanan dan tolak dengan 403 Forbidden.
 *    [STEP 4] -> Jika admin, panggil `next()` untuk meneruskan ke Admin Controller.
 */

import { Request, Response, NextFunction } from "express";

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // [STEP 1: PASTIKAN USER SUDAH TERAUTENTIKASI]
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Autentikasi diperlukan. Silakan login terlebih dahulu.",
    });
    return;
  }

  // [STEP 2: CEK HAK AKSES ADMINISTRATOR (RBAC)]
  if (req.user.role !== "admin") {
    console.warn(
      `🚨 [SECURITY AUDIT] Akses ilegal ke rute admin oleh pengguna: ${req.user.username} (ID: ${req.user.id})`
    );
    res.status(403).json({
      success: false,
      message: "Akses ditolak. Anda tidak memiliki hak akses administrator.",
    });
    return;
  }

  // [STEP 3: TERUSKAN KE CONTROLLER ADMIN]
  next();
};

