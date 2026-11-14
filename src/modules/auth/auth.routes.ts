import { Router } from "express";
import { register, login, logout, me } from "./auth.controller.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/register", validateRequest(registerSchema), register);
authRouter.post("/login", validateRequest(loginSchema), login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);

