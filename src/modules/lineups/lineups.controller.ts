import { Request, Response, NextFunction } from "express";
import { Lineup } from "../../models/lineup.model.js";

export const getLineups = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lineups = await Lineup.find().sort({ day: 1, artistName: 1 });
    res.status(200).json({
      success: true,
      data: lineups,
    });
  } catch (error) {
    next(error);
  }
};

