import { Router } from "express";
import { createOrder, getMyOrders } from "./orders.controller.js";
import { createOrderSchema } from "./orders.schema.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

export const orderRouter = Router();

orderRouter.post("/", requireAuth, validateRequest(createOrderSchema), createOrder);
orderRouter.get("/my-tickets", requireAuth, getMyOrders);

