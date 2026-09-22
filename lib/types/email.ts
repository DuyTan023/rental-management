import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResetPasswordEmail(email: string, otp: string) {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: "Mã xác thực đặt lại mật khẩu",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2 style="color: #3b82f6;">
          Đặt lại mật khẩu
        </h2>

        <p>
          Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản của mình.
        </p>

        <p>
          Mã OTP của bạn là:
        </p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #2563eb;
          margin: 20px 0;
        ">
          ${otp}
        </div>

        <p>
          Mã OTP có hiệu lực trong <strong>5 phút</strong>.
        </p>

        <p>
          Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
