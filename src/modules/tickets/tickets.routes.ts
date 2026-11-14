/**
 * ============================================================================
 * [TICKETS ROUTES] - src/modules/tickets/tickets.routes.ts
 * ============================================================================
 * Routing publik untuk modul tiket di bawah prefix `/api/v1/tickets`.
 */

import { Router } from "express";
import { getTicketTiers } from "./tickets.controller.js";

export const ticketRouter = Router();

// [ENDPOINT GET /tiers]: Mengambil daftar kategori tiket yang tersedia
ticketRouter.get("/tiers", getTicketTiers);
