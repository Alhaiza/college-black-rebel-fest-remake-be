/**
 * ============================================================================
 * [REQUEST VALIDATION MIDDLEWARE] - src/middlewares/validate.middleware.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Di PHP native lama (`register.php`), validasi input dilakukan secara manual:
 *    `if(empty($username)) { alert('...'); }`
 *    Pendekatan ini berantakan, rawan terlewat, dan jika tipe data yang dikirim
 *    bukan string (misalnya objek MongoDB injection `{ "$ne": null }`), kode langsung jebol.
 * 
 * 2. DESKRIPSI & FUNGSI (What it does):
 *    Middleware ini menerima skema Zod (misal `registerSchema`, `createOrderSchema`),
 *    lalu mencegat dan memeriksa isi `req.body` sebelum sampai ke Controller.
 *    Jika data tidak sesuai aturan, request langsung ditolak dengan status HTTP 400.
 * 
 * 3. ALUR EKSEKUSI (Execution Flow):
 *    [STEP 1] -> Menerima parameter `schema` Zod melalui teknik Higher-Order Function.
 *    [STEP 2] -> Mengeksekusi `schema.parseAsync(req.body)`.
 *    [STEP 3] -> Jika data valid, simpan data yang sudah dibersihkan/dikonversi kembali ke `req.body`
 *                dan panggil `next()` untuk melanjutkan ke Controller.
 *    [STEP 4] -> Jika data cacat, lempar error ke `next(error)` yang akan ditangkap oleh
 *                `error.middleware.ts` untuk diformat menjadi pesan JSON yang rapi.
 */

// [STEP 1: IMPORT DEPENDENCIES DARI EXPRESS & ZOD]
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

// [STEP 2: HIGHER-ORDER FUNCTION PEMBUAT MIDDLEWARE VALIDASI]
export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // [STEP 3: PARSE & SANITASI PAYLOAD BODY]
      // parseAsync akan membuang field tak dikenal (strip unknown) dan mengonversi tipe data
      req.body = await schema.parseAsync(req.body);
      
      // Jika lolos tanpa throw exception, lanjutkan ke handler berikutnya
      next();
    } catch (error) {
      // [STEP 4: OPER ERROR VALIDASI KE ERROR HANDLER]
      // ZodError akan ditangkap oleh centralized error middleware
      next(error);
    }
  };
};
