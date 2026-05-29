import { findUserByPhoneNo, normalizePhoneNo } from "../../../utils/phone-auth";

const otpStore = new Map<string, { code: string; expiredAt: number }>();

export default {
  async sendOtp(ctx: any) {
    console.log("sendOtp hit!");
    const { phone_no } = ctx.request.body;
    const normalizedPhoneNo = normalizePhoneNo(phone_no);

    if (!normalizedPhoneNo) {
      return ctx.badRequest("phone_no wajib diisi");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(normalizedPhoneNo, { code, expiredAt });

    const user = await findUserByPhoneNo(strapi, normalizedPhoneNo);
    if (user) {
      await strapi.db.query("plugin::users-permissions.user").update({
        where: { id: user.id },
        data: {
          otp_code: code,
          otp_expired_at: new Date(expiredAt),
        },
      });
    }

    const fonnteRes = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: process.env.FONNTE_TOKEN as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: normalizedPhoneNo,
        message: `Kode OTP Anda adalah *${code}*. Berlaku 5 menit. Jangan berikan kode ini kepada siapapun.`,
      }),
    });

    if (!fonnteRes.ok) {
      strapi.log.error("Fonnte error:", await fonnteRes.text());
      return ctx.internalServerError("Gagal mengirim OTP, coba lagi");
    }

    return ctx.send({ message: "OTP berhasil dikirim" });
  },

  async verifyOtp(ctx: any) {
    console.log("verifyOtp hit!");
    const { phone_no, otp_code } = ctx.request.body;
    const normalizedPhoneNo = normalizePhoneNo(phone_no);

    if (!normalizedPhoneNo || !otp_code) {
      return ctx.badRequest("phone_no dan otp_code wajib diisi");
    }

    const stored = otpStore.get(normalizedPhoneNo);
    const user = await findUserByPhoneNo(strapi, normalizedPhoneNo);
    const storedCode = stored?.code ?? user?.otp_code;
    const storedExpiredAt = stored?.expiredAt ?? (user?.otp_expired_at ? new Date(user.otp_expired_at).getTime() : null);

    if (!storedCode || !storedExpiredAt) {
      return ctx.badRequest("OTP tidak ditemukan, kirim ulang kode");
    }
    if (Date.now() > storedExpiredAt) {
      otpStore.delete(normalizedPhoneNo);
      return ctx.badRequest("Kode OTP sudah kadaluarsa");
    }
    if (storedCode !== otp_code) {
      return ctx.badRequest("Kode OTP tidak valid");
    }

    otpStore.delete(normalizedPhoneNo);
    if (user) {
      await strapi.db.query("plugin::users-permissions.user").update({
        where: { id: user.id },
        data: {
          otp_code: null,
          otp_expired_at: null,
        },
      });
    }

    return ctx.send({ message: "OTP valid", verified: true });
  },

  async resetPasswordPhone(ctx: any) {
    const { phone_no, otp_code, password, password_confirmation, passwordConfirmation } = ctx.request.body;
    const normalizedPhoneNo = normalizePhoneNo(phone_no);
    const confirmation = password_confirmation ?? passwordConfirmation;

    if (!normalizedPhoneNo || !otp_code || !password) {
      return ctx.badRequest("phone_no, otp_code, dan password wajib diisi");
    }

    if (password.length < 6) {
      return ctx.badRequest("Password minimal 6 karakter");
    }

    if (confirmation !== undefined && password !== confirmation) {
      return ctx.badRequest("Konfirmasi password tidak sama");
    }

    const user = await findUserByPhoneNo(strapi, normalizedPhoneNo);
    if (!user) {
      return ctx.badRequest("Nomor tidak terdaftar");
    }

    if (user.blocked) {
      return ctx.badRequest("Akun diblokir, hubungi admin");
    }

    const stored = otpStore.get(normalizedPhoneNo);
    const storedCode = stored?.code ?? user.otp_code;
    const storedExpiredAt = stored?.expiredAt ?? (user.otp_expired_at ? new Date(user.otp_expired_at).getTime() : null);

    if (!storedCode || !storedExpiredAt) {
      return ctx.badRequest("OTP tidak ditemukan, kirim ulang kode");
    }

    if (Date.now() > storedExpiredAt) {
      otpStore.delete(normalizedPhoneNo);
      await strapi.db.query("plugin::users-permissions.user").update({
        where: { id: user.id },
        data: {
          otp_code: null,
          otp_expired_at: null,
        },
      });
      return ctx.badRequest("Kode OTP sudah kadaluarsa");
    }

    if (storedCode !== otp_code) {
      return ctx.badRequest("Kode OTP tidak valid");
    }

    await strapi.plugins["users-permissions"].services.user.edit(user.id, {
      password,
      otp_code: null,
      otp_expired_at: null,
    });
    otpStore.delete(normalizedPhoneNo);

    return ctx.send({ message: "Password berhasil direset" });
  },

  async register(ctx: any) {
    const { phone_no, username, password } = ctx.request.body;
    const normalizedPhoneNo = normalizePhoneNo(phone_no);

    if (!normalizedPhoneNo || !username || !password) {
      return ctx.badRequest("phone_no, username, dan password wajib diisi");
    }

    const existing = await findUserByPhoneNo(strapi, normalizedPhoneNo);
    if (existing) {
      return ctx.badRequest("Nomor sudah terdaftar");
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const defaultRole = await strapi.db.query("plugin::users-permissions.role").findOne({
      where: { type: "authenticated" },
    });

    const user = await strapi.db.query("plugin::users-permissions.user").create({
      data: {
        username,
        email: `${normalizedPhoneNo}@ksm.placeholder`,
        phone_no: normalizedPhoneNo,
        password: hashedPassword,
        confirmed: true,
        blocked: false,
        role: defaultRole?.id,
      },
    });

    // Seragam pakai "jwt" supaya konsisten dengan login
    const jwt = strapi.plugins["users-permissions"].services.jwt.issue({ id: user.id });

    return ctx.send({
      jwt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone_no: user.phone_no,
        confirmed: user.confirmed,
        blocked: user.blocked,
        user_role: user.user_role ?? "customer",
      },
    });
  },

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  async login(ctx: any) {
    console.log("login hit!");
    const { phone_no, password } = ctx.request.body;
    const normalizedPhoneNo = normalizePhoneNo(phone_no);

    if (!normalizedPhoneNo || !password) {
      return ctx.badRequest("phone_no dan password wajib diisi");
    }

    // Cari user berdasarkan phone_no
    const user = await findUserByPhoneNo(strapi, normalizedPhoneNo);

    if (!user) {
      return ctx.badRequest("Nomor tidak terdaftar");
    }

    if (user.blocked) {
      return ctx.badRequest("Akun diblokir, hubungi admin");
    }

    // Verifikasi password
    const bcrypt = require("bcryptjs");
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return ctx.badRequest("Password salah");
    }

    // Generate JWT
    const jwt = strapi.plugins["users-permissions"].services.jwt.issue({ id: user.id });

    return ctx.send({
      jwt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone_no: user.phone_no,
        confirmed: user.confirmed,
        blocked: user.blocked,
        user_role: user.user_role ?? "customer",
      },
    });
  },
};
