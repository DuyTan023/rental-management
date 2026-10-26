import { prisma } from "@/lib/prisma";
import {
  apiErrorResponse,
  apiSuccessResponse,
  serverErrorResponse,
} from "@/lib/utils/api-error";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

// api/auth/update/route.ts
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    const oldPassword = String(body.oldPassword ?? ""); // pass cũ
    const newPassword = String(body.newPassword ?? ""); // pass mới
    const confirmPassword = String(body.confirmPassword ?? ""); // xác nhận pass mới

    // Kiểm tra dữ liệu đầu vào
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      return apiErrorResponse("Vui lòng nhập đầy đủ thông tin", 400);
    }

    //  Kiểm tra password ở SERVER.

    const isValidPassword =
      newPassword.length >= 8 &&
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /\d/.test(newPassword);

    if (!isValidPassword) {
      return apiErrorResponse(
        "Mật khẩu phải có ít nhất 8 ký tự, chữ hoa, chữ thường và số.",
        400,
      );
    }

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu
    if (newPassword !== confirmPassword) {
      return apiErrorResponse(
        "Mật khẩu mới và xác nhận mật khẩu không khớp",
        400,
      );
    }

    // Không cho phép mật khẩu mới trùng mật khẩu cũ
    if (oldPassword === newPassword) {
      return apiErrorResponse("Mật khẩu mới phải khác mật khẩu hiện tại", 400);
    }
    // Lấy user theo emai
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return apiErrorResponse("Không tìm thấy user", 404);
    }
    // Kiểm tra mật khẩu cũ
    if (!user.password_hash) {
      return apiErrorResponse("Tài khoản chưa có mật khẩu", 400);
    }

    // Kiểm tra mật khẩu cũ
    const isCorrectPassword = await bcrypt.compare(
      oldPassword,
      user.password_hash,
    );

    if (!isCorrectPassword) {
      return apiErrorResponse("Mật khẩu hiện tại không chính xác", 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
      },
    });

    return apiSuccessResponse("Cập nhật password thành công", null, 200);
  } catch (error) {
    console.log("Lỗi khi cập nhật password");
    return serverErrorResponse();
  }
}
