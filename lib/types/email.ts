
import nodemailer from "nodemailer";

// Kiểm tra cấu hình SMTP
const smtpUser = process.env.SMTP_USER;
const smtpAppPassword = process.env.SMTP_APP_PASSWORD;

if (!smtpUser || !smtpAppPassword) {
  throw new Error(
    "Thiếu SMTP_USER hoặc SMTP_APP_PASSWORD trong file .env.local",
  );
}

// Cấu hình Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpAppPassword,
  },
});

// Địa chỉ email người gửi
const mailFrom: nodemailer.SendMailOptions["from"] = {
  name: "Hệ thống quản lý phòng trọ",
  address: smtpUser,
};

// Email OTP đặt lại mật khẩu
export async function sendResetPasswordEmail(email: string, otp: string) {
  const info = await transporter.sendMail({
    from: mailFrom,
    to: email,
    subject: "Mã xác thực đặt lại mật khẩu",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; color: #333;">
        <h2 style="color: #3b82f6;">
          Đặt lại mật khẩu
        </h2>

        <p>
          Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản của mình.
        </p>

        <p>Mã OTP của bạn là:</p>

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
          Nếu bạn không yêu cầu đặt lại mật khẩu,
          hãy bỏ qua email này.
        </p>

        <p style="font-size: 12px; color: #666; margin-top: 30px;">
          Đây là email tự động, vui lòng không trả lời email này.
        </p>
      </div>
    `,
  });

  return info;
}

// // Email mời kích hoạt tài khoản
// export async function sendActiveUser(email: string, activationLink: string) {
//   const info = await transporter.sendMail({
//     from: mailFrom,
//     to: email,
//     subject: "Lời mời kích hoạt tài khoản",
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; color: #333;">
//         <h2 style="color: #3b82f6;">
//           Kích hoạt tài khoản
//         </h2>

//         <p>
//           Tài khoản của bạn đã được tạo thành công.
//         </p>

//         <p>
//           Vui lòng nhấn vào nút bên dưới để kích hoạt tài khoản
//           và thiết lập mật khẩu.
//         </p>

//         <div style="text-align: center; margin: 30px 0;">
//           <a
//             href="${activationLink}"
//             style="
//               display: inline-block;
//               padding: 12px 24px;
//               background-color: #2563eb;
//               color: #ffffff;
//               text-decoration: none;
//               border-radius: 6px;
//               font-weight: bold;
//             "
//           >
//             Kích hoạt tài khoản
//           </a>
//         </div>

//         <p>
//           Liên kết này có hiệu lực trong <strong>24 giờ</strong>.
//         </p>

//         <p>
//           Nếu bạn không mong đợi email này, vui lòng bỏ qua email.
//         </p>

//         <p style="font-size: 12px; color: #666; margin-top: 30px;">
//           Đây là email tự động, vui lòng không trả lời email này.
//         </p>
//       </div>
//     `,
//   });

//   return info;
// }

// Email kích hoạt tài khoản
export async function sendActiveUser(
  email: string,
  activationLink: string,
) {
  const info = await transporter.sendMail({
    from: mailFrom,
    to: email,
    subject: "Hoàn tất đăng ký tài khoản - Hệ thống quản lý phòng trọ",

    // Phiên bản văn bản thuần
    text: `
Xin chào,

Bạn đã yêu cầu tạo tài khoản tại Hệ thống quản lý phòng trọ.

Để hoàn tất đăng ký và thiết lập mật khẩu, vui lòng mở liên kết sau:

${activationLink}

Liên kết có hiệu lực trong 24 giờ.

Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email.

Hệ thống quản lý phòng trọ
    `.trim(),

    // Phiên bản HTML
    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 500px;
        margin: 0 auto;
        color: #333;
        line-height: 1.6;
      ">
        <h2 style="color: #2563eb;">
          Hoàn tất đăng ký tài khoản
        </h2>

        <p>Xin chào,</p>

        <p>
          Bạn đã yêu cầu tạo tài khoản tại
          <strong>Hệ thống quản lý phòng trọ</strong>.
        </p>

        <p>
          Vui lòng nhấn vào nút bên dưới để hoàn tất đăng ký
          và thiết lập mật khẩu cho tài khoản.
        </p>

        <p style="margin: 24px 0;">
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
        </p>

        <p>
          Liên kết có hiệu lực trong <strong>24 giờ</strong>.
        </p>

        <p>
          Nếu bạn không yêu cầu tạo tài khoản,
          vui lòng bỏ qua email này.
        </p>

        <hr style="
          border: 0;
          border-top: 1px solid #eee;
          margin: 24px 0;
        " />

        <p style="font-size: 12px; color: #666;">
          Email tự động từ Hệ thống quản lý phòng trọ.
        </p>
      </div>
    `,
  });

  console.log("Activation email result:", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  });

  return info;
}
