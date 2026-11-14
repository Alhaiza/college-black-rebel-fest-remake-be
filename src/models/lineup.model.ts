import { Schema, model, Document } from "mongoose";

export interface ILineup extends Document {
  artistName: string;
  day: number;
  stage: string;
  timeSlot: string;
  imageUrl: string;
  description: string;
}

const lineupSchema = new Schema<ILineup>(
  {
    artistName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    day: {
      type: Number,
      required: true,
      enum: [1, 2, 3],
    },
    stage: {
      type: String,
      required: true,
      default: "Main Stage",
    },
    timeSlot: {
      type: String,
      default: "19:00 - 21:00",
    },
    imageUrl: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const Lineup = model<ILineup>("Lineup", lineupSchema);

