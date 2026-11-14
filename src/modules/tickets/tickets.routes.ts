import { Router } from "express";
import { getTicketTiers } from "./tickets.controller.js";

export const ticketRouter = Router();

ticketRouter.get("/tiers", getTicketTiers);

