import { z } from "zod";

export const createOrderSchema = z.object({
  tierId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Ticket Tier ID"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Minimum quantity is 1")
    .max(5, "Maximum quantity is 5"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

