import { Schema, model, Document, Types } from "mongoose";

export interface IOrder extends Document {
  userId: Types.ObjectId;
  tierId: Types.ObjectId;
  tierName: string;
  quantity: number;
  totalAmount: number;
  status: "paid" | "cancelled";
  ticketCodes: string[];
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
      enum: ["paid", "cancelled"],
      default: "paid",
    },
    ticketCodes: [
      {
        type: String,
        required: true,
      },
    ],
  },
  { timestamps: true }
);

export const Order = model<IOrder>("Order", orderSchema);

