/**
 * ============================================================================
 * [LINEUPS ROUTES] - src/modules/lineups/lineups.routes.ts
 * ============================================================================
 * Routing publik untuk jadwal artis di bawah prefix `/api/v1/lineups`.
 */

import { Router } from "express";
import { getLineups } from "./lineups.controller.js";

export const lineupRouter = Router();

// [ENDPOINT GET /]: Mengambil seluruh jadwal artis festival
lineupRouter.get("/", getLineups);
