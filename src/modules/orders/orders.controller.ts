/**
 * ============================================================================
 * [TICKET ORDER CONTROLLER] - src/modules/orders/orders.controller.ts
 * ============================================================================
 * Konsep untuk Developer PHP:
 * Di PHP lama (`tiket.php` & `bayar.php`), alur pemesanan tiket:
 * 1. Simpan pilihan di session: `$_SESSION["jenis"] = $jenis`
 * 2. Tanpa cek stok kuota, langsung query: `INSERT INTO tiket VALUES ('', '$username', ...)`
 * 
 * Di controller modern ini, kita menerapkan:
 * - Autentikasi berbasis JWT (menggantikan session_id PHP).
 * - "Atomic Mutation" MongoDB: Memotong stok dan memvalidasi ketersediaan dalam 1 langkah tunggal.
 * - Mengatasi masalah Race Condition / Overselling (tiket tidak bisa minus jika dibeli barengan).
 * - Compensation Rollback jika terjadi kegagalan sistem di tengah jalan.
 */

// [STEP 1: IMPORT DEPENDENCIES, MODELS, & TYPES]
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { TicketTier } from "../../models/ticketTier.model.js";
import { Order } from "../../models/order.model.js";
import { CreateOrderInput } from "./orders.schema.js";

/**
 * [CONTROLLER 1: CREATE ORDER (PEMESANAN TIKET ATOMIK)]
 * Menerima request pemesanan tiket dari user yang sudah terautentikasi.
 */
export const createOrder = async (
  req: Request<{}, {}, CreateOrderInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // [STEP 2: EKSTRAKSI DATA DARI REQUEST]
  // tierId & quantity sudah divalidasi oleh Zod middleware sebelum masuk ke controller ini
  const { tierId, quantity } = req.body;
  
  // userId diperoleh dari payload JWT token yang sudah diverifikasi di auth.middleware.ts
  const userId = req.user?.id;

  // 2.1. Guard clause: Pastikan user terautentikasi dan BUKAN admin
  if (!userId) {
    res.status(401).json({ success: false, message: "Akses ditolak. Silakan login." });
    return;
  }

  if (req.user?.role === "admin") {
    res.status(403).json({
      success: false,
      message: "Akun Administrator tidak diizinkan untuk memesan tiket festival.",
    });
    return;
  }

  // [STEP 3: ATOMIC INVENTORY DECREMENT (MENCEGAH RACE CONDITION)]
  // Ini adalah solusi paling krusial untuk kasus High Concurrency (Chaos Engineering):
  // Kita HANYA mengurangi stok (availableQuota) JIKA stok saat ini >= kuantitas yang dipesan.
  // Jika 100 orang klik tombol beli bersamaan saat tiket tersisa 1, hanya 1 orang yang berhasil.
  const updatedTier = await TicketTier.findOneAndUpdate(
    { 
      _id: tierId, 
      availableQuota: { $gte: quantity } // Syarat: Kuota harus cukup
    },
    { 
      $inc: { availableQuota: -quantity } // Kurangi kuota secara atomik
    },
    { new: true } // Kembalikan data terbaru setelah kuota dikurangi
  );

  // 3.1. Jika tier tidak ditemukan atau kuota tidak mencukupi, respons 409 Conflict (Sold Out)
  if (!updatedTier) {
    res.status(409).json({
      success: false,
      message: "Tiket sudah habis atau jumlah yang dipesan melebihi sisa kuota yang tersedia.",
    });
    return;
  }

  // [STEP 4: SIMPAN PESANAN KE DATABASE DENGAN KOMPENSASI ROLLBACK]
  try {
    // 4.1. Hitung total biaya pesanan (menggunakan tipe number, bukan string)
    const totalAmount = updatedTier.price * quantity;

    // 4.2. Buat kode barcode unik dan kriptografis untuk setiap tiket (untuk QR Code)
    // Contoh format: "BRF22-A1B2C3D4"
    const ticketCodes = Array.from({ length: quantity }, () =>
      `BRF22-${crypto.randomBytes(4).toString("hex").toUpperCase()}`
    );

    // 4.3. Simpan dokumen order ke collection MongoDB 'orders'
    const order = await Order.create({
      userId,
      tierId: updatedTier._id,
      tierName: updatedTier.name,
      quantity,
      totalAmount,
      status: "paid",
      ticketCodes,
    });

    // 4.4. Kembalikan respons JSON sukses (Status 201 Created)
    res.status(201).json({
      success: true,
      message: "Tiket festival berhasil dipesan!",
      data: order,
    });
  } catch (error) {
    // [STEP 5: COMPENSATION ROLLBACK (PENANGANAN KEGAGALAN DARURAT)]
    // Jika penyimpanan order ke database gagal (misal koneksi drop di tengah jalan),
    // kita wajib mengembalikan kuota tiket yang sebelumnya sudah sempat kita kurangi di Step 3.
    await TicketTier.findByIdAndUpdate(tierId, { $inc: { availableQuota: quantity } });
    
    // Oper error ke middleware global error handler (src/server.ts)
    next(error);
  }
};

/**
 * [CONTROLLER 2: GET MY ORDERS (MELIHAT DAFTAR TIKET SAYA)]
 * Menggantikan query lama `SELECT * FROM tiket WHERE username = '$username'`
 */
export const getMyOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // [STEP 1: AMBIL USER ID DARI TOKEN AUTH]
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Akses ditolak. Silakan login." });
      return;
    }

    // [STEP 2: QUERY DATABASE SECARA AMAN DENGAN MONGOOSE]
    // Tidak ada celah SQL Injection karena Mongoose memperlakukan parameter sebagai data murni.
    // Diurutkan dari transaksi yang paling baru (createdAt descending).
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    // [STEP 3: KEMBALIKAN DATA TIKET KE FRONTEND]
    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};
