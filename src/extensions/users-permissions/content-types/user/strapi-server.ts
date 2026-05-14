const otpStore = new Map<string, { code: string; expiredAt: number }>();

export default (plugin: any) => {
  plugin.routes["content-api"].routes.push(
    {
      method: "POST",
      path: "/auth/send-otp",
      handler: "auth.sendOtp",
      config: { auth: false },
    },
    {
      method: "POST",
      path: "/auth/verify-otp",
      handler: "auth.verifyOtp",
      config: { auth: false },
    }
  );

  const originalController = plugin.controllers.auth;

  plugin.controllers.auth = ({ strapi }: { strapi: any }) => ({
    ...originalController({ strapi }),

    async sendOtp(ctx: any) {
      const { phone_no } = ctx.request.body;

      if (!phone_no) {
        return ctx.badRequest("phone_no wajib diisi");
      }

      // Generate OTP 6 digit
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiredAt = Date.now() + 5 * 60 * 1000; // 5 menit

      // Simpan ke store
      otpStore.set(phone_no, { code, expiredAt });

      // Kirim via Fonnte
      const fonnteRes = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: process.env.FONNTE_TOKEN as string,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: phone_no,
          message: `Kode OTP Anda adalah *${code}*. Berlaku 5 menit. Jangan berikan kode ini kepada siapapun.`,
        }),
      });

      if (!fonnteRes.ok) {
        strapi.log.error("Fonnte error:", await fonnteRes.text());
        return ctx.internalServerError("Gagal mengirim OTP, coba lagi");
      }

      return ctx.send({ message: "OTP berhasil dikirim" });
    },

    // POST /api/auth/verify-otp
    // body: { phone_no: "628xxxxxxxxx", otp_code: "123456" }
    async verifyOtp(ctx: any) {
      const { phone_no, otp_code } = ctx.request.body;

      if (!phone_no || !otp_code) {
        return ctx.badRequest("phone_no dan otp_code wajib diisi");
      }

      const stored = otpStore.get(phone_no);

      if (!stored) {
        return ctx.badRequest("OTP tidak ditemukan, kirim ulang kode");
      }

      if (Date.now() > stored.expiredAt) {
        otpStore.delete(phone_no);
        return ctx.badRequest("Kode OTP sudah kadaluarsa");
      }

      if (stored.code !== otp_code) {
        return ctx.badRequest("Kode OTP tidak valid");
      }

      // Hapus OTP setelah berhasil diverifikasi
      otpStore.delete(phone_no);

      return ctx.send({ message: "OTP valid", verified: true });
    },
  });

  return plugin;
};