import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { TicketTier } from "../../models/ticketTier.model.js";
import { Order } from "../../models/order.model.js";
import { CreateOrderInput } from "./orders.schema.js";

export const createOrder = async (
  req: Request<{}, {}, CreateOrderInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { tierId, quantity } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  // ATOMIC INVENTORY DECREMENT (Prevents Race Condition / Overselling)
  const updatedTier = await TicketTier.findOneAndUpdate(
    { _id: tierId, availableQuota: { $gte: quantity } },
    { $inc: { availableQuota: -quantity } },
    { new: true }
  );

  if (!updatedTier) {
    res.status(409).json({
      success: false,
      message: "Ticket is sold out or requested quantity exceeds available stock.",
    });
    return;
  }

  try {
    const totalAmount = updatedTier.price * quantity;
    const ticketCodes = Array.from({ length: quantity }, () =>
      `BRF22-${crypto.randomBytes(4).toString("hex").toUpperCase()}`
    );

    const order = await Order.create({
      userId,
      tierId: updatedTier._id,
      tierName: updatedTier.name,
      quantity,
      totalAmount,
      status: "paid",
      ticketCodes,
    });

    res.status(201).json({
      success: true,
      message: "Ticket successfully ordered!",
      data: order,
    });
  } catch (error) {
    // Compensation rollback in case order persistence fails
    await TicketTier.findByIdAndUpdate(tierId, { $inc: { availableQuota: quantity } });
    next(error);
  }
};

export const getMyOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

