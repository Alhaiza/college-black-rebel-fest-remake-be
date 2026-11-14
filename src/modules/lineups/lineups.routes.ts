import { Router } from "express";
import { getLineups } from "./lineups.controller.js";

export const lineupRouter = Router();

lineupRouter.get("/", getLineups);

