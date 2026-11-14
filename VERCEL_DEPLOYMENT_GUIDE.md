# 🚀 Panduan Deploy Backend Express ke Vercel (100% Gratis)

Backend API Black Rebel Fest telah dikonfigurasi agar dapat dijalankan sebagai **Serverless Functions** di Vercel secara native tanpa kartu kredit.

---

## 🛠️ Langkah-Langkah Deploy di Vercel:

1. Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik tombol **Add New...** -> Pilih **Project**.
3. Import repository:  
   `Alhaiza/college-black-rebel-fest-remake-be`.
4. Pada halaman konfigurasi project Vercel:
   - **Framework Preset:** Pilih `Other`.
   - **Root Directory:** `./`
   - **Build Command:** Biarkan default atau kosong (Vercel otomatis membaca `vercel.json` dan `api/index.ts`).
   - **Output Directory:** Kosongkan.
5. Buka bagian **Environment Variables**, tambahkan 4 variabel ini:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `MONGODB_URI` = `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/brf_remake?retryWrites=true&w=majority`
   - `JWT_SECRET` = `supersecret_blackrebelfest2022_resilient_key_min32chars`
   - `JWT_EXPIRES_IN` = `1d`
   - `CORS_ORIGIN` = `*`
6. Klik tombol **Deploy**!
7. Dalam 1 menit backend Anda akan aktif dan memberikan URL (contoh: `https://college-black-rebel-fest-remake-be.vercel.app`).

### Uji Coba:
Buka di browser:
- `https://nama-backend-anda.vercel.app/health` -> Harus mengembalikan `{"status":"healthy"}`.
- `https://nama-backend-anda.vercel.app/api/v1/tickets/tiers` -> Menampilkan data tiket Bronze, Silver, Gold.
