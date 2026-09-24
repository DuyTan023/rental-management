import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const resetToken = String(body.resetToken ?? "");

    const password = String(body.password ?? "");

    if (!resetToken || !password) {
      return NextResponse.json(
        {
          error: "Dữ liệu không hợp lệ!",
        },
        { status: 400 },
      );
    }

    //  Kiểm tra password ở SERVER.

    const isValidPassword =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password);

    if (!isValidPassword) {
      return NextResponse.json(
        {
          error: "Mật khẩu phải có ít nhất 8 ký tự, chữ hoa, chữ thường và số.",
        },
        { status: 400 },
      );
    }

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

    let payload;

    try {
      const result = await jwtVerify(resetToken, secret);

      payload = result.payload;
    } catch {
      return NextResponse.json(
        {
          error: "Reset token không hợp lệ hoặc đã hết hạn!",
        },
        { status: 401 },
      );
    }

    // Kiểm tra mục đích của token.

    if (
      payload.purpose !== "password-reset" ||
      typeof payload.userId !== "string"
    ) {
      return NextResponse.json(
        {
          error: "Reset token không hợp lệ!",
        },
        { status: 401 },
      );
    }

    const userId = BigInt(payload.userId);

    // Tìm user.

    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Tài khoản không tồn tại!",
        },
        { status: 404 },
      );
    }

    // Hash password mới.

    const passwordHash = await bcrypt.hash(password, 12);

    // Cập nhật password.

    await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        password_hash: passwordHash,
        updated_at: new Date(),
      },
    });

    //  Vô hiệu hóa tất cả OTP reset
    //  của user sau khi đổi password.

    await prisma.password_reset_otps.updateMany({
      where: {
        user_id: userId,
        used_at: null,
      },
      data: {
        used_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đổi mật khẩu thành công!",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return NextResponse.json(
      {
        error: "Không thể đổi mật khẩu. Vui lòng thử lại.",
      },
      { status: 500 },
    );
  }
}
