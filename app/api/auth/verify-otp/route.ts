import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    const otp = String(body.otp ?? "").trim();

    if (!email || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { message: "OTP không hợp lệ!" },
        { status: 400 },
      );
    }

    const user = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "OTP không hợp lệ!" },
        { status: 400 },
      );
    }

    const resetOtp = await prisma.password_reset_otps.findFirst({
      where: {
        user_id: user.id,
        used_at: null,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (!resetOtp) {
      return NextResponse.json(
        {
          message: "OTP không tồn tại hoặc đã được sử dụng!",
        },
        { status: 400 },
      );
    }

    if (resetOtp.expires_at < new Date()) {
      return NextResponse.json(
        {
          message: "OTP đã hết hạn!",
        },
        { status: 400 },
      );
    }

    if (resetOtp.attempts >= 5) {
      return NextResponse.json(
        {
          message:
            "Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu mã mới.",
        },
        { status: 400 },
      );
    }

    const isValid = await bcrypt.compare(otp, resetOtp.otp_hash);

    if (!isValid) {
      await prisma.password_reset_otps.update({
        where: {
          id: resetOtp.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      return NextResponse.json(
        {
          message: "OTP không chính xác!",
        },
        { status: 400 },
      );
    }

    // =========================
    // TẠO RESET TOKEN
    // =========================

    const secret = process.env.AUTH_SECRET;

    if (!secret) {
      console.error("AUTH_SECRET chưa được cấu hình!");

      return NextResponse.json(
        {
          message: "Server chưa được cấu hình AUTH_SECRET!",
        },
        { status: 500 },
      );
    }

    const resetToken = await new SignJWT({
      userId: user.id.toString(),
      purpose: "password-reset",
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(new TextEncoder().encode(secret));

    return NextResponse.json({
      success: true,
      message: "OTP hợp lệ!",
      resetToken,
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return NextResponse.json(
      {
        message: "Có lỗi xảy ra!",
      },
      { status: 500 },
    );
  }
}
