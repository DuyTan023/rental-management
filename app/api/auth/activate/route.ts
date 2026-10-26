// api/auth/activate/route.ts
/*Kiểm tra dữ liệu đầu vào và quy tắc mật khẩu.
Hash token nhận được rồi tìm lời mời trong bảng invitations.
Kiểm tra lời mời tồn tại, chưa hết hạn và có trạng thái PENDING.
Kiểm tra tài khoản chưa được kích hoạt và chưa có mật khẩu.
Hash mật khẩu mới bằng bcrypt.
Cập nhật password_hash, status, activated_at của user.
Cập nhật trạng thái lời mời và accepted_at.
Thực hiện các cập nhật trong cùng một transaction để tránh trường hợp tài khoản được kích hoạt nhưng lời mời chưa được cập nhật.*/
import { account_status, invitation_status } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  apiErrorResponse,
  apiSuccessResponse,
  serverErrorResponse,
} from "@/lib/utils/api-error";

import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const token = String(body.token ?? "").trim();
    const newPassword = String(body.newPassword ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");

    // Kiểm tra dữ liệu đầu vào
    if (!token || !newPassword || !confirmPassword) {
      return apiErrorResponse("Vui lòng nhập đầy đủ thông tin", 400);
    }

    // Kiểm tra độ mạnh của mật khẩu
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

    // Kiểm tra xác nhận mật khẩu
    if (newPassword !== confirmPassword) {
      return apiErrorResponse(
        "Mật khẩu mới và xác nhận mật khẩu không khớp",
        400,
      );
    }

    // Hash token để tìm lời mời trong database
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const invitation = await prisma.invitations.findUnique({
      where: {
        token_hash: tokenHash,
      },
      include: {
        users: true,
      },
    });

    if (!invitation) {
      return apiErrorResponse("Lời mời kích hoạt không hợp lệ", 400);
    }

    // Kiểm tra trạng thái lời mời
    if (invitation.status !== invitation_status.PENDING) {
      return apiErrorResponse(
        "Lời mời đã được sử dụng hoặc không còn hiệu lực",
        400,
      );
    }

    // Kiểm tra thời hạn lời mời
    if (invitation.expires_at <= new Date()) {
      return apiErrorResponse(
        "Lời mời đã hết hạn. Vui lòng yêu cầu gửi lại lời mời.",
        400,
      );
    }

    // Kiểm tra trạng thái tài khoản
    const user = invitation.users;

    if (user.status === account_status.ACTIVE) {
      return apiErrorResponse("Tài khoản đã được kích hoạt", 400);
    }

    if (user.password_hash !== null) {
      return apiErrorResponse("Tài khoản đã được thiết lập mật khẩu", 400);
    }

    // Hash mật khẩu mới
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Cập nhật user và lời mời trong cùng transaction
    const now = new Date();

    const activated = await prisma.$transaction(async (tx) => {
      // Đánh dấu lời mời đã được chấp nhận nếu vẫn còn hiệu lực.
      const invitationResult = await tx.invitations.updateMany({
        where: {
          id: invitation.id,
          status: invitation_status.PENDING,
          expires_at: { gt: now },
        },
        data: {
          status: invitation_status.ACCEPTED,
          accepted_at: now,
        },
      });

      if (invitationResult.count !== 1) {
        throw new Error("INVITATION_INVALID");
      }

      // Chỉ kích hoạt nếu user vẫn chưa có mật khẩu
      // và chưa được kích hoạt bởi request khác.
      const userResult = await tx.users.updateMany({
        where: {
          id: invitation.user_id,
          status: { not: account_status.ACTIVE },
          password_hash: null,
        },
        data: {
          password_hash: passwordHash,
          status: account_status.ACTIVE,
          activated_at: now,
        },
      });

      if (userResult.count !== 1) {
        throw new Error("USER_ALREADY_ACTIVATED");
      }

      return true;
    });

    if (!activated) {
      return apiErrorResponse("Không thể kích hoạt tài khoản", 400);
    }

    return apiSuccessResponse(
      "Kích hoạt tài khoản và thiết lập mật khẩu thành công",
      null,
      200,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "INVITATION_INVALID") {
      return apiErrorResponse("Lời mời đã được sử dụng hoặc hết hạn", 400);
    }

    if (error instanceof Error && error.message === "USER_ALREADY_ACTIVATED") {
      return apiErrorResponse(
        "Tài khoản đã được kích hoạt hoặc đã có mật khẩu",
        400,
      );
    }

    console.error("Lỗi khi kích hoạt tài khoản:", error);
    return serverErrorResponse();
  }
}
