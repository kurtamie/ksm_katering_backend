export default {
    routes: [
      {
        method: "POST",
        path: "/auth/send-otp",
        handler: "otp.sendOtp",
        config: { auth: false },
      },
      {
        method: "POST",
        path: "/auth/verify-otp",
        handler: "otp.verifyOtp",
        config: { auth: false },
      },
      {
        method: "POST",
        path: "/auth/register",
        handler: "otp.register",
        config: { auth: false },
      },
      {
        method: "POST",
        path: "/auth/login",
        handler: "otp.login",
        config: { auth: false },
      },
      {
        method: "POST",
        path: "/auth/reset-password-phone",
        handler: "otp.resetPasswordPhone",
        config: { auth: false },
      },
    ],
  };
