/**
 * ============================================================================
 * [ORDERS SCHEMA & ROUTES] - src/modules/orders/orders.schema.ts & orders.routes.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Di PHP lama, jumlah tiket disimpan sebagai teks string ('satu', 'dua', 'tiga')
 *    dan ID tidak divalidasi formatnya.
 *    Skema Zod ini memastikan `tierId` wajib berupa 24 karakter heksadesimal MongoDB ObjectId,
 *    dan kuantitas tiket berupa integer antara 1 sampai 5.
 */

import { z } from "zod";

// [SKEMA ORDER TIKET]
export const createOrderSchema = z.object({
  // tierId harus berupa MongoDB ObjectId valid (24 karakter hex)
  tierId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID Kategori Tiket tidak valid"),

  // quantity: wajib bilangan bulat, minimal 1 tiket, maksimal 5 tiket per pesanan
  quantity: z
    .number()
    .int("Jumlah tiket harus berupa bilangan bulat")
    .min(1, "Minimal pemesanan adalah 1 tiket")
    .max(5, "Maksimal pemesanan adalah 5 tiket per transaksi"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
