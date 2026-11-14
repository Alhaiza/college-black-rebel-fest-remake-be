import { Schema, model, Document } from "mongoose";

export interface ITicketTier extends Document {
  name: string;
  price: number;
  totalQuota: number;
  availableQuota: number;
  perks: string[];
}

const ticketTierSchema = new Schema<ITicketTier>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    totalQuota: {
      type: Number,
      required: true,
      min: 0,
    },
    availableQuota: {
      type: Number,
      required: true,
      min: 0,
    },
    perks: [{ type: String }],
  },
  { timestamps: true }
);

ticketTierSchema.index({ availableQuota: 1 });

export const TicketTier = model<ITicketTier>("TicketTier", ticketTierSchema);

