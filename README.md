# 🎸 Black Rebel Fest 2022 (BRF22) - Backend API

Layanan RESTful Backend API untuk festival musik **Black Rebel Fest 2022**, dimigrasikan dari PHP Native prosedural lama ke **Node.js + Express.js + TypeScript + MongoDB (Mongoose)** dengan arsitektur berlapis (*Layered/Modular Architecture*).

---

## 🎯 Mengapa Dibuat & Masalah yang Diselesaikan

1. **Menggantikan Query Rentan SQL Injection**: Di PHP lama, parameter URL/form dimasukkan langsung ke SQL (`SELECT * FROM tiket WHERE username = '$username'`). Di sini digantikan oleh Mongoose ODM dan validasi skema runtime **Zod**.
2. **Mengatasi Race Condition / Overselling Tiket**: Menggunakan *atomic query* MongoDB (`$inc` dan `$gte`) agar kuota tiket tidak minus saat diserbu ribuan user bersamaan.
3. **Mengamankan Autentikasi**: Menggantikan `$_SESSION` file PHP yang rawan pembajakan dengan **Stateless JWT** yang tersimpan aman di dalam **HttpOnly Secure Cookie**.
4. **Pemisahan Peran Tegas (Bidirectional RBAC)**:
   - Pengguna biasa (`user`) diblokir dari endpoint administratif (`/api/v1/admin/*`).
   - Administrator diblokir dari pemesanan tiket untuk mencegah manipulasi kuota dan konflik kepentingan.
5. **Resiliency & Fault Tolerance**: Terdapat *Compensation Rollback* jika pembuatan data tiket gagal di tengah jalan, serta *Centralized Error Boundary*.

---

## 📁 Struktur Folder Backend

```text
api/
└── index.ts                     # Handler entry point untuk deployment Vercel Serverless
src/
├── app.ts                       # Konfigurasi instance Express & middleware pipeline
├── config/
│   ├── env.ts                   # Validasi variabel .env saat server boot (Zod)
│   └── db.ts                    # Koneksi MongoDB dengan resilience & connection caching
├── middlewares/
│   ├── auth.middleware.ts       # Verifikasi token JWT dari HttpOnly cookie / Bearer
│   ├── admin.middleware.ts      # RBAC Guard: Memastikan role === 'admin'
│   ├── userOnly.middleware.ts   # RBAC Guard: Mencegah admin memesan tiket penonton
│   ├── validate.middleware.ts   # Interceptor validasi payload HTTP body via Zod
│   └── error.middleware.ts      # Global error handler (Zod, Mongoose duplicate, 500)
├── models/
│   ├── user.model.ts            # Skema User (username, email, passwordHash, role)
│   ├── ticketTier.model.ts      # Skema Tier Tiket (Bronze, Silver, Gold, harga, stok)
│   ├── order.model.ts           # Skema Order, kode barcode unik & audit status check-in
│   └── lineup.model.ts          # Skema Artis & jadwal panggung festival
├── modules/
│   ├── admin/                   # Controller & Routes analitik, restock kuota & QR scanner
│   ├── auth/                    # Controller, Routes, & Schema Zod Autentikasi
│   ├── tickets/                 # Controller & Routes katalog tiket publik
│   ├── orders/                  # Controller, Routes, & Schema pemesanan tiket atomik
│   └── lineups/                 # Controller & Routes jadwal artis per hari
├── seed.ts                      # Script seeding otomatis data awal festival
└── server.ts                    # Entry point listener server lokal
vercel.json                      # Konfigurasi routing serverless Vercel
Dockerfile                       # Multi-stage production container
```

---

## ⚡ Alur Eksekusi Data (Execution Flow)

```text
Client (React / HTTP Request)
       │
       ▼
[app.ts] -> Helmet -> CORS -> express.json() -> cookieParser() -> Rate Limiter
       │
       ▼
[routes.ts] -> /api/v1/... (Auth, Tickets, Orders, Lineups, Admin)
       │
       ▼
[validate.middleware.ts] -> Memvalidasi format data request menggunakan Zod schema
       │
       ▼
[auth / admin / userOnly.middleware.ts] -> Evaluasi token JWT & otorisasi hak akses (RBAC)
       │
       ▼
[controller.ts] -> Eksekusi logic bisnis & mutasi atomik database Mongoose
       │
       ▼
[error.middleware.ts] -> Tangkap & rapikan respons error jika terjadi kegagalan
```

---

## 🚀 Panduan Menjalankan Proyek

### 1. Menjalankan di Lokal (Development)
1. Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies & isi database awal:
   ```bash
   pnpm install
   pnpm run seed    # Mengisi 9 artis lineup, 3 tier tiket, dan default user admin
   ```
3. Jalankan server lokal:
   ```bash
   pnpm run dev     # Berjalan di http://localhost:5000
   ```
   - Health Check: `GET http://localhost:5000/health`

---

## ☁️ Panduan Deploy Gratis ke Vercel (Serverless)

Backend ini sudah dikonfigurasi menggunakan `vercel.json` agar bisa berjalan sebagai **Serverless Function di Vercel tanpa perlu kartu kredit**:

### 1. Konfigurasi Wajib MongoDB Atlas (IP Whitelist)
Sebelum deploy ke Vercel, pastikan cluster MongoDB Atlas Anda mengizinkan koneksi dari serverless Vercel (IP dinamis AWS):
1. Buka [cloud.mongodb.com](https://cloud.mongodb.com) -> Masuk ke menu **Network Access** (di bawah kategori *Security*).
2. Klik tombol **Add IP Address**.
3. Pilih **Allow Access from Anywhere** (atau isi IP `0.0.0.0/0`).
4. Klik **Confirm** dan pastikan statusnya sudah **Active**.
*(Tanpa langkah ini, backend Vercel akan mengalami timeout buffering saat mencoba query data).*

### 2. Langkah Deploy di Vercel
1. Login ke [vercel.com](https://vercel.com) -> Klik **Add New...** -> **Project**.
2. Import repository GitHub: `Alhaiza/college-black-rebel-fest-remake-be`.
3. Pada halaman konfigurasi Vercel:
   - **Framework Preset**: Pilih `Other`.
   - **Root Directory**: `./`.
4. Tambahkan **Environment Variables** di dashboard Vercel:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `MONGODB_URI` = `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`
   - `JWT_SECRET` = `<your_jwt_secret_min_32_chars>`
   - `JWT_EXPIRES_IN` = `1d`
   - `CORS_ORIGIN` = `*` (atau URL Vercel Frontend Anda)
5. Klik **Deploy**! Backend akan aktif dan memberikan URL publik gratis (misal: `https://<your-backend-app>.vercel.app`).
   - Uji koneksi: `https://<your-backend-app>.vercel.app/health` -> mengembalikan `{"status":"healthy"}`.
