/**
 * ============================================================================
 * [LINEUPS CONTROLLER & ROUTES] - src/modules/lineups/lineups.controller.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Di PHP lama (`lineup.php`), 200+ baris HTML ditulis manual (hardcoded card)
 *    untuk masing-masing artis seperti Twice, Slipknot, Yoasobi.
 * 
 * 2. DESKRIPSI & FUNGSI (What it does):
 *    Menyediakan data dinamis artis lineup festival, dikelompokkan berdasarkan
 *    hari konser (Day 1, 2, 3), panggung (Stage), dan jadwal jam tampil (Timeslot).
 */

import { Request, Response, NextFunction } from "express";
import { Lineup } from "../../models/lineup.model.js";

/**
 * [CONTROLLER]: Mengambil daftar artis konser diurutkan berdasarkan hari dan nama artis
 */
export const getLineups = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Ambil semua artis dan urutkan berdasarkan hari festival (day 1 -> 3), lalu abjad nama
    const lineups = await Lineup.find().sort({ day: 1, artistName: 1 });
    
    res.status(200).json({
      success: true,
      data: lineups,
    });
  } catch (error) {
    next(error);
  }
};
