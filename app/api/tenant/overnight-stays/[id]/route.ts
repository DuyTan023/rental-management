
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { overnightStayService } from "@/lib/api/services/overnight-stay/overnight-stay.service";
import { apiErrorResponse, apiSuccessResponse, errorResponse, serverErrorResponse } from "@/lib/utils/api-error";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
        return apiErrorResponse("Vui lòng đăng nhập", 401);
    }
    
    if (session.user.role !== "TENANT") {
        return apiErrorResponse("Không có quyền truy cập", 403);
    }

    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return Response.json(
        { success: false, message: "ID không hợp lệ" },
        { status: 400 }
      );
    }

    const data = await overnightStayService.getMyDetail(
      BigInt(session.user.id),
      BigInt(id)
    );

    return apiSuccessResponse(
      "Lấy chi tiết thông báo thành công",
        data,
      200
    );
  } catch (error) {
    return serverErrorResponse();
  }
}

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

    if (session.user.role !== "TENANT") {
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

    const body = await request.json();

    const data = await overnightStayService.update(
      BigInt(session.user.id),
      BigInt(id),
      body
    );

    return apiSuccessResponse(
      "Cập nhật thông báo lưu trú thành công",
      data, 201
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
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

    if (session.user.role !== "TENANT") {
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

    const data = await overnightStayService.cancel(
      BigInt(session.user.id),
      BigInt(id)
    );

    return apiSuccessResponse(
      "Hủy thông báo lưu trú thành công",
      data, 200
    );
  } catch (error) {
    return errorResponse(error);
  }
}
