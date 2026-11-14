import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { ENV } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { errorHandler } from "./middlewares/error.middleware.js";

// Mengimpor routing modular domain
import { authRouter } from "./modules/auth/auth.routes.js";
import { ticketRouter } from "./modules/tickets/tickets.routes.js";
import { orderRouter } from "./modules/orders/orders.routes.js";
import { lineupRouter } from "./modules/lineups/lineups.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";

export const app: Application = express();

// Pastikan koneksi database aktif saat request masuk di serverless environment
app.use(async (_req, _res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    next(err);
  }
});

// Middleware Keamanan & Parsing
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (seperti mobile apps, curl) atau jika origin diizinkan
      if (!origin || origin.includes("localhost") || origin.includes("vercel.app") || origin === ENV.CORS_ORIGIN) {
        callback(null, true);
      } else {
        callback(null, true); // Fleksibel untuk environment college / dev
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "15kb" }));
app.use(cookieParser());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: "Terlalu banyak permintaan dari IP ini, silakan coba lagi setelah 15 menit.",
  },
});
app.use("/api", apiLimiter);

// Health Check Endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Registrasi Modular Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/tickets", ticketRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/lineups", lineupRouter);
app.use("/api/v1/admin", adminRouter);

// Centralized Error Handler
app.use(errorHandler);

