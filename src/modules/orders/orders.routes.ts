/**
 * ============================================================================
 * [ORDERS ROUTES] - src/modules/orders/orders.routes.ts
 * ============================================================================
 * Routing privat untuk transaksi tiket di bawah prefix `/api/v1/orders`.
 */

import { Router } from "express";
import { createOrder, getMyOrders } from "./orders.controller.js";
import { createOrderSchema } from "./orders.schema.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireUserOnly } from "../../middlewares/userOnly.middleware.js";

export const orderRouter = Router();

// [ENDPOINT 1]: POST / -> Pesan tiket
// Guard 1: requireAuth (wajib login)
// Guard 2: requireUserOnly (ADMIN DILARANG ORDER TIKET, KHUSUS USER BIASA)
// Guard 3: validateRequest (cek format tierId dan kuantitas integer)
orderRouter.post("/", requireAuth, requireUserOnly, validateRequest(createOrderSchema), createOrder);

// [ENDPOINT 2]: GET /my-tickets -> Ambil riwayat tiket milik penonton
orderRouter.get("/my-tickets", requireAuth, requireUserOnly, getMyOrders);
