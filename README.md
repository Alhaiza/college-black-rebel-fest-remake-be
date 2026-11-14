# 🎸 Black Rebel Fest 2022 (BRF22) - Backend API

Layanan RESTful Backend API untuk festival musik **Black Rebel Fest 2022**, dimigrasikan dari PHP Native prosedural lama ke **Node.js + Express.js + TypeScript + MongoDB (Mongoose)** dengan arsitektur berlapis (*Layered/Modular Architecture*).

---

## 🎯 Mengapa Dibuat & Masalah yang Diselesaikan

1. **Menggantikan Query Rentan SQL Injection**: Di PHP lama, parameter URL/form dimasukkan langsung ke SQL (`SELECT * FROM tiket WHERE username = '$username'`). Di sini digantikan oleh Mongoose ODM dan validasi skema runtime **Zod**.
2. **Mengatasi Race Condition / Overselling Tiket**: Menggunakan *atomic query* MongoDB (`$inc` dan `$gte`) agar kuota tiket tidak minus saat diserbu ribuan user bersamaan.
3. **Mengamankan Autentikasi**: Menggantikan `$_SESSION` file PHP yang rawan pembajakan dengan **Stateless JWT** yang tersimpan aman di dalam **HttpOnly Secure Cookie**.
4. **Resiliency & Fault Tolerance**: Terdapat *Compensation Rollback* jika pembuatan data tiket gagal di tengah jalan, serta *Centralized Error Boundary*.

---

## 📁 Struktur Folder Backend

```text
src/
├── config/
│   ├── env.ts                   # Validasi variabel .env saat server boot (Zod)
│   └── db.ts                    # Koneksi MongoDB dengan resilience auto-reconnect
├── middlewares/
│   ├── auth.middleware.ts       # Verifikasi token JWT dari HttpOnly cookie / Bearer
│   ├── validate.middleware.ts   # Interceptor validasi payload HTTP body via Zod
│   └── error.middleware.ts      # Global error handler (Zod, Mongoose duplicate, 500)
├── models/
│   ├── user.model.ts            # Skema User (username, email, passwordHash, role)
│   ├── ticketTier.model.ts      # Skema Tier Tiket (Bronze, Silver, Gold, harga, stok)
│   ├── order.model.ts           # Skema Order & daftar kode voucher unik
│   └── lineup.model.ts          # Skema Artis & jadwal panggung festival
├── modules/
│   ├── auth/                    # Controller, Routes, & Schema Zod Autentikasi
│   ├── tickets/                 # Controller & Routes katalog tiket publik
│   ├── orders/                  # Controller, Routes, & Schema pemesanan tiket atomik
│   └── lineups/                 # Controller & Routes jadwal artis per hari
├── seed.ts                      # Script seeding otomatis data awal festival
└── server.ts                    # Entry point Express pipeline (Helmet, CORS, Rate-Limit)
```

---

## ⚡ Alur Eksekusi Data (Execution Flow)

```text
Client (React / HTTP Request)
       │
       ▼
[server.ts] -> Helmet (Header Security) -> CORS -> express.json() -> cookieParser() -> Rate Limiter
       │
       ▼
[routes.ts] -> /api/v1/... (Auth, Tickets, Orders, Lineups)
       │
       ▼
[validate.middleware.ts] -> Memvalidasi format data request menggunakan Zod schema
       │
       ▼
[auth.middleware.ts] -> Memverifikasi keabsahan JWT cookie (khusus endpoint private)
       │
       ▼
[controller.ts] -> Menjalankan logic bisnis & operasi database atomik Mongoose
       │
       ▼
[error.middleware.ts] -> Menangkap & merapikan respons error jika terjadi kegagalan
```

---

## 🛠️ Cara Menjalankan Backend

### 1. Prasyarat
- Node.js (v20+ LTS)
- pnpm (atau npm)
- MongoDB berjalan di port `27017` (lokal atau via `docker compose up -d`)

### 2. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi default `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/brf_remake
JWT_SECRET=supersecret_blackrebelfest2022_resilient_key_min32chars
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:5173
```

### 3. Install Dependencies & Seeding
```bash
pnpm install
pnpm run seed    # Mengisi 9 artis lineup, 3 tier tiket, dan default user admin
```

### 4. Jalankan Server
```bash
pnpm run dev     # Berjalan di http://localhost:5000
```
- Health Check: `GET http://localhost:5000/health`
- Build Production: `pnpm run build` dilanjutkan `pnpm run start`
