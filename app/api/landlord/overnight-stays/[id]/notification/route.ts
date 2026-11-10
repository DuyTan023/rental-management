
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { overnightStayService } from "@/lib/api/services/overnight-stay/overnight-stay.service";
import { apiSuccessResponse, errorResponse } from "@/lib/utils/api-error";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    if (session.user.role !== "LANDLORD") {
      return Response.json(
        { success: false, message: "Không có quyền truy cập" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return Response.json(
        { success: false, message: "ID không hợp lệ" },
        { status: 400 }
      );
    }

    const data =
      await overnightStayService.completeNotification(
        BigInt(id),
        BigInt(session.user.id)
      );

    return apiSuccessResponse(
      "Đã cập nhật trạng thái khai báo lưu trú",
        data,
      210
    );
  } catch (error) {
    return errorResponse(error);
  }
}
