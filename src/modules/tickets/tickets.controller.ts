/**
 * ============================================================================
 * [TICKETS CONTROLLER & ROUTES]
 * src/modules/tickets/tickets.controller.ts & tickets.routes.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Di PHP lama, kategori tiket di-hardcode di tag HTML `<select>` pada file `tiket.php`:
 *    `<option value="bronze">Bronze</option>`
 *    Jika panitia ingin mengubah harga atau menambah tier tiket, file PHP harus diedit manual.
 * 
 * 2. DESKRIPSI & FUNGSI (What it does):
 *    Menyediakan endpoint publik bagi frontend untuk mengambil daftar tier tiket
 *    yang aktif (Bronze, Silver, Gold), lengkap beserta harga, sisa kuota live,
 *    dan fasilitas (perks) langsung dari database MongoDB.
 */

// Controller (tickets.controller.ts)
import { Request, Response, NextFunction } from "express";
import { TicketTier } from "../../models/ticketTier.model.js";

/**
 * [CONTROLLER]: Mengambil seluruh tier tiket yang diurutkan dari harga termurah
 */
export const getTicketTiers = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Cari semua dokumen TicketTier dan urutkan berdasarkan field 'price' (ascending)
    const tiers = await TicketTier.find().sort({ price: 1 });
    
    res.status(200).json({
      success: true,
      data: tiers,
    });
  } catch (error) {
    next(error);
  }
};
