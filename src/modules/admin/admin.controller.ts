/**
 * ============================================================================
 * [ADMIN MANAGEMENT CONTROLLER] - src/modules/admin/admin.controller.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Menyediakan layanan inti bagi panitia festival Black Rebel Fest untuk:
 *    - Melihat analitik finansial & kuota secara real-time.
 *    - Memindai dan memvalidasi tiket masuk di gerbang konser (Gate Check-in).
 *    - Restock kapasitas kuota tiket dengan proteksi agar tidak terjadi kuota negatif.
 *    - Mengaudit seluruh riwayat transaksi pesanan penonton.
 */

import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Order } from "../../models/order.model.js";
import { TicketTier } from "../../models/ticketTier.model.js";
import { User } from "../../models/user.model.js";

/**
 * [ENDPOINT 1: DASHBOARD ANALYTICS]
 * Menghitung Total Pendapatan, Tiket Terjual, dan Status Kuota Real-time.
 * Alur Eksekusi:
 * [STEP 1] Eksekusi Aggregation Pipeline ($facet) pada collection 'orders'.
 * [STEP 2] Hitung jumlah total pengguna terdaftar.
 * [STEP 3] Ambil status tier tiket terkini.
 * [STEP 4] Kembalikan ringkasan data analitik.
 */
export const getDashboardAnalytics = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const analytics = await Order.aggregate([
      { $match: { status: { $in: ["paid", "checked-in"] } } },
      {
        $facet: {
          revenueSummary: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" },
                totalTicketsSold: { $sum: "$quantity" },
                totalOrders: { $sum: 1 },
              },
            },
          ],
          tierBreakdown: [
            {
              $group: {
                _id: "$tierName",
                ticketsSold: { $sum: "$quantity" },
                subtotalRevenue: { $sum: "$totalAmount" },
              },
            },
          ],
        },
      },
    ]);

    const activeUsersCount = await User.countDocuments();
    const tiers = await TicketTier.find().lean();

    const summary = analytics[0]?.revenueSummary[0] || {
      totalRevenue: 0,
      totalTicketsSold: 0,
      totalOrders: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: summary.totalRevenue,
        totalTicketsSold: summary.totalTicketsSold,
        totalOrders: summary.totalOrders,
        activeUsersCount,
        tierBreakdown: analytics[0]?.tierBreakdown || [],
        tiers,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [ENDPOINT 2: GATE CHECK-IN SCANNER]
 * Memvalidasi kode barcode QR di pintu masuk konser.
 * Alur Eksekusi:
 * [STEP 1] Validasi input ticketCode.
 * [STEP 2] Cari pesanan yang memiliki kode barcode tersebut.
 * [STEP 3] Anomaly Case Check: Cegah pemindaian ganda (Double Entry Prevention).
 *          Jika status sudah 'checked-in', tolak dengan status 400.
 * [STEP 4] Update status order menjadi 'checked-in' beserta timestamp dan ID admin pemeriksa.
 */
export const scanTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ticketCode } = req.body;
    const adminId = req.user?.id;

    if (!ticketCode || typeof ticketCode !== "string") {
      res.status(400).json({ success: false, message: "Kode tiket wajib diisi." });
      return;
    }

    const order = await Order.findOne({ ticketCodes: ticketCode.trim() }).populate(
      "userId",
      "username email"
    );

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Tiket tidak terdaftar di sistem! Barcode tidak valid.",
      });
      return;
    }

    // Anomaly Case: Cegah check-in tiket yang sama dua kali
    if (order.status === "checked-in") {
      res.status(400).json({
        success: false,
        message: `Tiket ini sudah pernah digunakan pada ${order.checkedInAt?.toLocaleString(
          "id-ID"
        )}. Akses gerbang ditolak!`,
      });
      return;
    }

    // Perbarui status menjadi checked-in
    order.status = "checked-in";
    order.checkedInAt = new Date();
    if (adminId) {
      order.checkedInBy = new Types.ObjectId(adminId);
    }
    await order.save();

    res.status(200).json({
      success: true,
      message: "Validasi tiket berhasil! Silakan berikan gelang akses festival.",
      data: {
        orderId: order._id,
        tierName: order.tierName,
        quantity: order.quantity,
        holder: order.userId,
        checkedInAt: order.checkedInAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [ENDPOINT 3: RESTOCK & UPDATE TIER]
 * Memperbarui harga dan total kuota tiket dengan proteksi agar kuota tidak minus.
 * Alur Eksekusi:
 * [STEP 1] Cari data tier berdasarkan ID.
 * [STEP 2] Edge Case Check: Hitung tiket yang sudah terjual (totalQuota - availableQuota).
 *          Kapasitas total baru TIDAK BOLEH lebih kecil dari tiket yang sudah laku.
 * [STEP 3] Hitung ulang sisa kuota (availableQuota = newTotalQuota - ticketsSold).
 * [STEP 4] Simpan perubahan ke database.
 */
export const updateTicketTier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { price, totalQuota } = req.body;

    const tier = await TicketTier.findById(id);
    if (!tier) {
      res.status(404).json({ success: false, message: "Kategori tiket tidak ditemukan." });
      return;
    }

    // Hitung tiket yang sudah terbit / terjual
    const ticketsSold = tier.totalQuota - tier.availableQuota;

    if (totalQuota !== undefined) {
      if (typeof totalQuota !== "number" || totalQuota < 0) {
        res.status(400).json({ success: false, message: "Total kuota harus berupa angka positif." });
        return;
      }

      // Cegah kuota minus jika admin memasukkan angka lebih kecil dari yang sudah laku
      if (totalQuota < ticketsSold) {
        res.status(400).json({
          success: false,
          message: `Total kuota baru (${totalQuota}) tidak boleh lebih kecil dari tiket yang sudah terjual (${ticketsSold}).`,
        });
        return;
      }

      tier.availableQuota = totalQuota - ticketsSold;
      tier.totalQuota = totalQuota;
    }

    if (price !== undefined) {
      if (typeof price !== "number" || price < 0) {
        res.status(400).json({ success: false, message: "Harga tiket harus berupa angka positif." });
        return;
      }
      tier.price = price;
    }

    await tier.save();

    res.status(200).json({
      success: true,
      message: `Tier ${tier.name} berhasil diperbarui.`,
      data: tier,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [ENDPOINT 4: GET ALL ORDERS]
 * Mengambil seluruh riwayat pesanan tiket dari seluruh user.
 */
export const getAllOrders = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await Order.find()
      .populate("userId", "username email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

