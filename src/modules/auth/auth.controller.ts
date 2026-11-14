/**
 * ============================================================================
 * [AUTH CONTROLLER] - src/modules/auth/auth.controller.ts
 * ============================================================================
 * 
 * 1. KENAPA DIBUAT? (Why it exists):
 *    Di PHP lama (`register.php`, `login.php`, `logout.php`), autentikasi bergantung
 *    pada fungsi prosedural `registrasi()` di `functions.php` dan `session_start()`.
 *    Controller ini menyatukan seluruh logika autentikasi (Register, Login, Logout, Me)
 *    ke dalam satu modul yang aman dan stateless menggunakan JWT + HttpOnly Cookie.
 * 
 * 2. DESKRIPSI & FUNGSI (What it does):
 *    - `register`: Mengecek duplikasi username/email, meng-hash password (bcrypt), dan simpan user.
 *    - `login`: Memverifikasi username & password, lalu menerbitkan JWT token di cookie.
 *    - `logout`: Menghapus cookie JWT dari browser.
 *    - `me`: Mengambil data profil user yang sedang login saat ini.
 */

// [STEP 1: IMPORT DEPENDENCIES & MODELS]
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../../models/user.model.js";
import { ENV } from "../../config/env.js";
import { RegisterInput, LoginInput } from "./auth.schema.js";

/**
 * [CONTROLLER 1: REGISTER USER BARU]
 * Alur Eksekusi:
 * [STEP 1] Ekstrak username, email, password dari req.body.
 * [STEP 2] Cek apakah username atau email sudah pernah dipakai orang lain.
 * [STEP 3] Hash password menggunakan bcrypt dengan salt rounds = 10.
 * [STEP 4] Simpan dokumen User baru ke MongoDB.
 * [STEP 5] Kembalikan HTTP 201 Created tanpa menyertakan password hash.
 */
export const register = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // 1.1. Cek duplikasi di MongoDB
    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "Username atau email sudah digunakan oleh pengguna lain.",
      });
      return;
    }

    // 1.2. Hashing password aman
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 1.3. Buat user baru
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      role: "user",
    });

    // 1.4. Respons berhasil
    res.status(201).json({
      success: true,
      message: "Akun berhasil dibuat! Silakan login untuk melanjutkan.",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [CONTROLLER 2: LOGIN USER]
 * Alur Eksekusi:
 * [STEP 1] Cari user di database berdasarkan username.
 * [STEP 2] Bandingkan password inputan dengan hash di database menggunakan bcrypt.compare.
 * [STEP 3] Buat token JWT yang menyimpan id, username, dan role.
 * [STEP 4] Pasang token tersebut ke dalam HttpOnly Cookie di browser client.
 * [STEP 5] Kembalikan HTTP 200 OK beserta data user.
 */
export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    // 2.1. Cari data user
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Username atau password salah.",
      });
      return;
    }

    // 2.2. Verifikasi password hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Username atau password salah.",
      });
      return;
    }

    // 2.3. Terbitkan token JWT
    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, role: user.role },
      ENV.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 2.4. Set HttpOnly Cookie (Kebal serangan XSS karena JS di browser tidak bisa membaca cookie ini)
    res.cookie("token", token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 jam
    });

    // 2.5. Respons berhasil
    res.status(200).json({
      success: true,
      message: "Login berhasil! Selamat datang di Black Rebel Fest.",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [CONTROLLER 3: LOGOUT USER]
 * Menghapus cookie token dari browser sehingga sesi pengguna langsung terputus.
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logout berhasil.",
  });
};

/**
 * [CONTROLLER 4: GET CURRENT USER PROFILE (ME)]
 * Mengambil profil user yang sedang aktif berdasarkan id dari token JWT terverifikasi.
 */
export const me = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Akses ditolak." });
    return;
  }

  // Cari user dan kecualikan passwordHash dari hasil query (-passwordHash)
  const user = await User.findById(req.user.id).select("-passwordHash");
  if (!user) {
    res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
    return;
  }

  res.status(200).json({
    success: true,
    data: user,
  });
};
