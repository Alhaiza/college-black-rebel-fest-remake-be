/**
 * ============================================================================
 * [AUTH SCHEMA VALIDATOR] - src/modules/auth/auth.schema.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Di PHP lama, aturan validasi tersebar di dalam `functions.php`:
 *    `if($password !== $password2) { alert('Konfirmasi Password salah!'); }`
 *    Di arsitektur modern, kontrak data (schema) dipisahkan dari controller
 *    agar aturan validasi bisa diuji, dideklarasikan secara deklaratif, dan
 *    secara otomatis menghasilkan tipe TypeScript (inferens).
 * 
 * 2. DESKRIPSI & FUNGSI (What it does):
 *    Mendefinisikan aturan ketat untuk data pendaftaran (`registerSchema`)
 *    dan data login (`loginSchema`).
 */

import { z } from "zod";

// [SKEMA 1: REGISTRASI PENGGUNA BARU]
export const registerSchema = z.object({
  // Username: minimal 3 karakter, maksimal 30, hanya boleh huruf, angka, dan underscore
  username: z
    .string()
    .min(3, "Username minimal harus 3 karakter")
    .max(30, "Username maksimal 30 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh mengandung huruf, angka, dan garis bawah"),

  // Email: wajib berupa format email yang valid
  email: z.string().email("Format alamat email tidak valid"),

  // Password: minimal 6 karakter demi standar keamanan dasar
  password: z.string().min(6, "Password minimal harus 6 karakter"),
});

// [SKEMA 2: LOGIN PENGGUNA]
export const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

// [TYPE INFERENCE]: Otomatis menghasilkan TypeScript Interface dari skema Zod di atas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
