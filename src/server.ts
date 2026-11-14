import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { ENV } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { errorHandler } from "./middlewares/error.middleware.js";

import { authRouter } from "./modules/auth/auth.routes.js";
import { ticketRouter } from "./modules/tickets/tickets.routes.js";
import { orderRouter } from "./modules/orders/orders.routes.js";
import { lineupRouter } from "./modules/lineups/lineups.routes.js";

const app: Application = express();

// Security Hardening Middlewares
app.use(helmet());
app.use(
  cors({
    origin: ENV.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "15kb" }));
app.use(cookieParser());

// Rate Limiting (Prevents Brute-force & DoS)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});
app.use("/api", apiLimiter);

// Health Check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Domain Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/tickets", ticketRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/lineups", lineupRouter);

// Centralized Error Handling
app.use(errorHandler);

const startServer = async () => {
  await connectDatabase();
  app.listen(ENV.PORT, () => {
    console.log(`📡 [Server] Running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
  });
};

startServer();

