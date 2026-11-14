/**
 * ============================================================================
 * [ENTRY POINT BACKEND SERVER] - src/server.ts
 * ============================================================================
 * Konsep untuk Developer PHP:
 * Di PHP native tradisional, setiap file .php dieksekusi dari awal sampai akhir
 * per HTTP request via Web Server (Apache/Nginx).
 * 
 * Di Node.js/Express, server berjalan sebagai "long-running process" tunggal.
 * File ini bertindak sebagai pipeline utama (middleware chain) tempat semua
 * request masuk dan diproses sebelum sampai ke controller.
 */

// [STEP 1: IMPORT DEPENDENCIES & ENVIRONMENT]
// Mengimpor module inti Express, plugin keamanan, parsing body/cookie, dan variabel environment
import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { ENV } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { errorHandler } from "./middlewares/error.middleware.js";

// Mengimpor routing modular domain (Domain-Driven Routers)
import { authRouter } from "./modules/auth/auth.routes.js";
import { ticketRouter } from "./modules/tickets/tickets.routes.js";
import { orderRouter } from "./modules/orders/orders.routes.js";
import { lineupRouter } from "./modules/lineups/lineups.routes.js";

// [STEP 2: INISIALISASI APLIKASI EXPRESS]
// Objek 'app' merepresentasikan aplikasi web server Express kita
const app: Application = express();

// [STEP 3: PASANG MIDDLEWARE KEAMANAN & PARSING (GLOBAL MIDDLEWARES)]
// Di PHP, Anda harus memanggil session_start() atau memfilter header manual di setiap script.
// Di Express, middleware yang di-use di sini akan otomatis berlaku untuk SELURUH request yang masuk.

// 3.1. Helmet: Mengamankan HTTP Headers (mencegah clickjacking, MIME sniffing, dll.)
app.use(helmet());

// 3.2. CORS (Cross-Origin Resource Sharing):
// Mengizinkan Frontend (React di port 5173) mengakses API Backend (port 5000) dengan aman.
// credentials: true wajib diset agar HttpOnly cookie (JWT token) dapat dikirim bolak-balik.
app.use(
  cors({
    origin: ENV.CORS_ORIGIN,
    credentials: true,
  })
);

// 3.3. Body Parser (Pengganti $_POST):
// Mengubah payload JSON yang dikirim client menjadi objek JavaScript di req.body.
// Dibatasi limit 15kb untuk mencegah serangan Denial of Service (DoS) melalui payload besar.
app.use(express.json({ limit: "15kb" }));

// 3.4. Cookie Parser (Pengganti $_COOKIE):
// Membaca header cookie HTTP dan menyimpannya di req.cookies secara otomatis.
app.use(cookieParser());

// [STEP 4: RATE LIMITING (PERTAHANAN BRUTE-FORCE)]
// Membatasi request maksimal per IP address dalam rentang waktu tertentu.
// Mencegah bot membanjiri server dengan ribuan request (chaos engineering mitigation).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 200, // Maksimal 200 request per IP dalam 15 menit
  message: {
    success: false,
    message: "Terlalu banyak permintaan dari IP ini, silakan coba lagi setelah 15 menit.",
  },
});
app.use("/api", apiLimiter);

// [STEP 5: HEALTH CHECK ENDPOINT]
// Endpoint ringan untuk monitoring status server (biasa dipakai Docker / Kubernetes / uptime bot).
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// [STEP 6: REGISTRASI MODULAR ROUTES]
// Menghubungkan URL prefix API dengan router domain masing-masing.
// Di PHP lama: Anda membuat file auth.php, order.php terpisah dan di-include via query string (?tiket).
// Di Express: Menggunakan RESTful path convention (/api/v1/...).
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/tickets", ticketRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/lineups", lineupRouter);

// [STEP 7: CENTRALIZED ERROR HANDLER (ERROR BOUNDARY)]
// Di PHP lama, error fatal seringkali langsung mencetak pesan PHP error ke layar (bocor ke publik).
// Middleware ini diletakkan paling bawah untuk menangkap semua error yang dilempar dari controller (next(err)),
// lalu merespons dengan JSON rapi berformat standar.
app.use(errorHandler);

// [STEP 8: START SERVER & DATABASE CONNECTION]
// Fungsi async untuk memastikan koneksi database MongoDB sukses sebelum server mulai menerima traffic.
const startServer = async () => {
  // 8.1. Hubungkan ke database MongoDB
  await connectDatabase();

  // 8.2. Mulai mendengarkan request masuk di port yang ditentukan
  app.listen(ENV.PORT, () => {
    console.log(`📡 [Server] Berjalan di mode ${ENV.NODE_ENV} pada port ${ENV.PORT}`);
  });
};

startServer();
