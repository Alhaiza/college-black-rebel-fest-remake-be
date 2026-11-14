import { Request, Response, NextFunction } from "express";
import { TicketTier } from "../../models/ticketTier.model.js";

export const getTicketTiers = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tiers = await TicketTier.find().sort({ price: 1 });
    res.status(200).json({
      success: true,
      data: tiers,
    });
  } catch (error) {
    next(error);
  }
};

