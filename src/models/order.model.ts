/**
 * ============================================================================
 * [ORDER MODEL] - src/models/order.model.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Di MySQL lama, tabel `tiket` hanya menyimpan `(id_tiket, username, jenis, jumlah)`
 *    di mana jumlah berupa string teks ('satu', 'dua') dan tidak memiliki foreign key
 *    maupun pencatatan status check-in tiket di pintu gerbang.
 * 
 * 2. DESKRIPSI & FUNGSI (What it does):
 *    Mendefinisikan skema Mongoose untuk transaksi pemesanan tiket beserta riwayat
 *    audit gate check-in (status `checked-in`, timestamp pemindaian, dan ID admin pemeriksa).
 */

import { Schema, model, Document, Types } from "mongoose";

export interface IOrder extends Document {
  userId: Types.ObjectId;
  tierId: Types.ObjectId;
  tierName: string;
  quantity: number;
  totalAmount: number;
  status: "paid" | "checked-in" | "cancelled";
  ticketCodes: string[];
  checkedInAt?: Date;
  checkedInBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tierId: {
      type: Schema.Types.ObjectId,
      ref: "TicketTier",
      required: true,
    },
    tierName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["paid", "checked-in", "cancelled"],
      default: "paid",
      index: true,
    },
    ticketCodes: [
      {
        type: String,
        required: true,
        index: true,
      },
    ],
    checkedInAt: {
      type: Date,
    },
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Order = model<IOrder>("Order", orderSchema);
