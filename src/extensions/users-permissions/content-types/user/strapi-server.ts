// src/extensions/users-permissions/strapi-server.ts

export default (plugin: any) => {
    plugin.routes["content-api"].routes.push(
      {
        method: "POST",
        path: "/auth/send-otp",
        handler: "auth.sendOtp",
        config: {
          middlewares: [],
          auth: false,
        },
      },
      {
        method: "POST",
        path: "/auth/verify-otp",
        handler: "auth.verifyOtp",
        config: {
          middlewares: [],
          auth: false,
        },
      }
    );
  
    // Tambah handler ke controller auth
    const originalController = plugin.controllers.auth;
  
    plugin.controllers.auth = ({ strapi }: { strapi: any }) => ({
      ...originalController({ strapi }),
  
      async sendOtp(ctx: any) {
        const { phone_no } = ctx.request.body;
  
        if (!phone_no) {
          return ctx.badRequest("phone_no wajib diisi");
        }
  
        // Cari user berdasarkan phone_no
        const [user] = await strapi.entityService.findMany(
          "plugin::users-permissions.user",
          {
            filters: { phone_no },
            limit: 1,
          }
        );
  
        if (!user) {
          return ctx.notFound("Nomor tidak terdaftar");
        }
  
        // Generate OTP 6 digit
        const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
  
        // Expired 5 menit dari sekarang
        const otp_expired_at = new Date(Date.now() + 5 * 60 * 1000);
  
        // Simpan ke user
        await strapi.entityService.update(
          "plugin::users-permissions.user",
          user.id,
          { data: { otp_code, otp_expired_at } }
        );
  
        // Kirim via Fonnte
        const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
  
        const fonnteRes = await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            Authorization: FONNTE_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target: phone_no,
            message: `Kode OTP Anda adalah *${otp_code}*. Berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.`,
          }),
        });
  
        if (!fonnteRes.ok) {
          strapi.log.error("Fonnte error:", await fonnteRes.text());
          return ctx.internalServerError("Gagal mengirim OTP, coba lagi");
        }
  
        return ctx.send({ message: "OTP berhasil dikirim" });
      },
  
      // POST /api/auth/verify-otp
      // body: { phone_no: "628xxxxxxxx", otp_code: "123456" }
      async verifyOtp(ctx: any) {
        const { phone_no, otp_code } = ctx.request.body;
  
        if (!phone_no || !otp_code) {
          return ctx.badRequest("phone_no dan otp_code wajib diisi");
        }
  
        const [user] = await strapi.entityService.findMany(
          "plugin::users-permissions.user",
          {
            filters: { phone_no },
            limit: 1,
          }
        );
  
        if (!user) {
          return ctx.notFound("Nomor tidak terdaftar");
        }
  
        // Cek OTP cocok
        if (user.otp_code !== otp_code) {
          return ctx.badRequest("Kode OTP tidak valid");
        }
  
        // Cek expired
        if (!user.otp_expired_at || new Date() > new Date(user.otp_expired_at)) {
          return ctx.badRequest("Kode OTP sudah kadaluarsa");
        }
  
        // Hapus OTP setelah berhasil diverifikasi
        await strapi.entityService.update(
          "plugin::users-permissions.user",
          user.id,
          { data: { otp_code: null, otp_expired_at: null } }
        );
  
        return ctx.send({ message: "OTP valid", verified: true });
      },
    });
  
    return plugin;
  };