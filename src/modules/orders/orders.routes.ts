/**
 * ============================================================================
 * [ORDERS ROUTES] - src/modules/orders/orders.routes.ts
 * ============================================================================
 * Routing privat untuk transaksi tiket di bawah prefix `/api/v1/orders`.
 * Semua endpoint di sini dilindungi oleh middleware `requireAuth`.
 */

import { Router } from "express";
import { createOrder, getMyOrders } from "./orders.controller.js";
import { createOrderSchema } from "./orders.schema.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

export const orderRouter = Router();

// [ENDPOINT 1]: POST / -> Pesan tiket (wajib login & lolos validasi createOrderSchema)
orderRouter.post("/", requireAuth, validateRequest(createOrderSchema), createOrder);

// [ENDPOINT 2]: GET /my-tickets -> Ambil riwayat tiket yang sudah dibeli oleh user saat ini
orderRouter.get("/my-tickets", requireAuth, getMyOrders);
