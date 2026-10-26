// api/auth/active-user/route.ts

import { account_status } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { sendActiveUser } from "@/lib/types/email";
import {
  apiErrorResponse,
  apiSuccessResponse,
  serverErrorResponse,
} from "@/lib/utils/api-error";
import { parseId } from "@/lib/utils/function";
import { createHash, randomBytes } from "crypto";
import type { NextRequest } from "next/server";

/*Nhận userId của tài khoản cần kích hoạt.
Kiểm tra user có tồn tại không.
Kiểm tra user đã kích hoạt hoặc đã có mật khẩu chưa.
Tạo token ngẫu nhiên.
Hash token và lưu vào bảng invitations.
Tạo link kích hoạt chứa token gốc.
Gửi email bằng hàm sendActiveUser.
Trả về thông báo đã gửi lời mời.*/
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const userId = parseId(body.userId);
    if (userId === null) {
      return apiErrorResponse("Vui lòng truyền vào user_id hợp lệ", 404);
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return apiErrorResponse("Không tìm thấy user hợp lệ", 404);
    }

    if (user.status === account_status.ACTIVE) {
      return apiErrorResponse("Tài khoản đã được kích hoạt", 400);
    }

    if (user.password_hash) {
      return apiErrorResponse("Tài khoản đã có mật khẩu", 400);
    }

    // Tạo token ngẫu nhiên
    const token = randomBytes(32).toString("hex");

    // Chỉ lưu hash của token vào database
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // Lời mời có hiệu lực trong 24 giờ
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Vô hiệu hóa các lời mời cũ còn chờ xử lý
    await prisma.invitations.updateMany({
      where: {
        user_id: user.id,
        status: "PENDING",
      },
      data: {
        status: "REVOKED",
      },
    });

    // Tạo lời mời mới
    await prisma.invitations.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        status: "PENDING",
        expires_at: expiresAt,
      },
    });

    // Tạo link kích hoạt
    const activationLink = `${process.env.NEXT_PUBLIC_APP_URL}/activate?token=${token}`;

    // Gửi email
    await sendActiveUser(user.email, activationLink);

    return apiSuccessResponse(
      "Đã tạo lời mời và gửi email kích hoạt tài khoản",
      null,
      200,
    );
  } catch (error) {
    console.error("Lỗi khi tạo lời mời kích hoạt:", error);
    return serverErrorResponse();
  }
}
