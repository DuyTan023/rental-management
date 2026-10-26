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

// email lời mời kích hoạt tài khoản

export async function sendActiveUser(email: string, activationLink: string) {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: "Lời mời kích hoạt tài khoản",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; color: #333;">
        <h2 style="color: #3b82f6;">
          Kích hoạt tài khoản
        </h2>

        <p>
          Tài khoản của bạn đã được tạo thành công.
        </p>

        <p>
          Vui lòng nhấn vào nút bên dưới để kích hoạt tài khoản và thiết lập mật khẩu.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a
            href="${activationLink}"
            style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            "
          >
            Kích hoạt tài khoản
          </a>
        </div>

        <p>
          Liên kết này có hiệu lực trong <strong>24 giờ</strong>.
        </p>

        <p>
          Nếu bạn không mong đợi email này, vui lòng bỏ qua email.
        </p>

        <p style="font-size: 12px; color: #666; margin-top: 30px;">
          Đây là email tự động, vui lòng không trả lời email này.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
