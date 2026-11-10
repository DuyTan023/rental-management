
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { overnightStayService } from "@/lib/api/services/overnight-stay/overnight-stay.service";
import { apiSuccessResponse, errorResponse } from "@/lib/utils/api-error";



export async function GET(request: NextRequest) {
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

    const params = request.nextUrl.searchParams;

    const page = Math.max(
      1,
      Number(params.get("page") || 1)
    );

    const limit = Math.min(
      100,
      Math.max(1, Number(params.get("limit") || 10))
    );

    const status = params.get("status");

    const allowedStatuses = [
      "PENDING",
      "COMPLETED",
      "CANCELLED",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return Response.json(
        { success: false, message: "Trạng thái không hợp lệ" },
        { status: 400 }
      );
    }

    const result = await overnightStayService.getLandlordList(
      page,
      limit,
      status as
        | "PENDING"
        | "COMPLETED"
        | "CANCELLED"
        | undefined
    );

      return apiSuccessResponse("Lấy danh sách lưu trú thành công", result, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
