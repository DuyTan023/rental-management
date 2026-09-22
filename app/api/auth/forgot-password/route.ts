import { prisma } from "@/lib/prisma";
import { sendResetPasswordEmail } from "@/lib/types/email";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email không hợp lệ!" },
        { status: 400 },
      );
    }

    const user = await prisma.users.findUnique({
      where: { email },
    });

    /*
     * Không nói cho client biết email có tồn tại hay không.
     */
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Nếu email tồn tại, mã OTP sẽ được gửi.",
      });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({
        success: true,
        message: "Nếu email tồn tại, mã OTP sẽ được gửi.",
      });
    }

    // Xóa OTP cũ chưa sử dụng
    await prisma.password_reset_otps.deleteMany({
      where: {
        user_id: user.id,
        used_at: null,
      },
    });

    // Tạo OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP trước khi lưu DB
    const otpHash = await bcrypt.hash(otp, 10);

    // OTP hết hạn sau 5 phút
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.password_reset_otps.create({
      data: {
        user_id: user.id,
        otp_hash: otpHash,
        expires_at: expiresAt,
      },
    });

    // Gửi email
    await sendResetPasswordEmail(email, otp);

    return NextResponse.json({
      success: true,
      message: "Mã OTP đã được gửi đến email của bạn.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return NextResponse.json(
      {
        error: "Không thể gửi mã OTP. Vui lòng thử lại.",
      },
      { status: 500 },
    );
  }
}
