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
    ],
  };