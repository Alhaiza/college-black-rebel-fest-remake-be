/**
 * ============================================================================
 * [ADMIN ROUTES] - src/modules/admin/admin.routes.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Menyatukan seluruh rute manajemen festival di bawah prefix `/api/v1/admin`.
 *    Setiap request wajib lolos dua lapis penjaga:
 *    1. `requireAuth`: Memastikan token JWT valid.
 *    2. `requireAdmin`: Memastikan user memiliki atribut `role === 'admin'`.
 */

import { Router } from "express";
import {
  getDashboardAnalytics,
  scanTicket,
  updateTicketTier,
  getAllOrders,
} from "./admin.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/admin.middleware.js";

export const adminRouter = Router();

// [PASANG DUA LAPIS KEAMANAN RBAC UNTUK SELURUH SUB-RUTE ADMIN]
adminRouter.use(requireAuth, requireAdmin);

// [ENDPOINT 1]: Ringkasan analitik pendapatan & status kuota
adminRouter.get("/analytics", getDashboardAnalytics);

// [ENDPOINT 2]: Pemindaian tiket QR di gerbang masuk konser
adminRouter.post("/scan-ticket", scanTicket);

// [ENDPOINT 3]: Restock kuota & update harga tier tiket
adminRouter.patch("/tiers/:id", updateTicketTier);

// [ENDPOINT 4]: Daftar seluruh transaksi tiket festival
adminRouter.get("/orders", getAllOrders);

