/**
 * ============================================================================
 * [VERCEL SERVERLESS HANDLER ENTRYPOINT] - api/index.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Vercel tidak menjalankan server Express tradisional dengan port listener
 *    seperti `app.listen(5000)`. Sebaliknya, Vercel menggunakan arsitektur
 *    "Serverless Functions" di mana setiap request HTTP ditangani oleh fungsi
 *    yang diekspor dari direktori `/api`.
 * 
 * 2. DESKRIPSI & FUNGSI (What it does):
 *    File ini mengimpor instance aplikasi Express (`app`) yang sudah dikonfigurasi
 *    lengkap dari `src/app.ts` dan mengekspornya sebagai default handler.
 *    File `vercel.json` akan mengarahkan semua traffic URL `/(.*)` langsung ke file ini.
 * 
 * 3. ALUR EKSEKUSI (Execution Flow):
 *    [STEP 1] -> Request masuk dari internet ke URL Vercel (contoh: https://domain.vercel.app/api/v1/tickets/tiers).
 *    [STEP 2] -> `vercel.json` me-rewrite request tersebut ke `api/index.ts`.
 *    [STEP 3] -> Instance Express `app` menerima request, memastikan koneksi MongoDB aktif,
 *                menjalankan middleware, dan memproses controller terkait.
 *    [STEP 4] -> Respons JSON dikembalikan ke client tanpa memerlukan server background yang menyala terus-menerus.
 */

// [STEP 1: IMPORT APLIKASI EXPRESS MODULAR]
import { app } from "../src/app.js";

// [STEP 2: EXPORT SEBAGAI SERVERLESS HANDLER VERCEL]
export default app;
