
import { auth } from "@/auth";
import { roomAssetService, RoomAssetError } from "@/lib/api/services/room-assets/room-asset.service";
import { apiErrorResponse, apiSuccessResponse, serverErrorResponse } from "@/lib/utils/api-error";
import { parseId } from "@/lib/utils/function";
import { NextRequest } from "next/server";

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
      return apiErrorResponse("Vui lòng đăng nhập", 401);
    }

    const { id } = await params;
    const assetId = parseId(id);

    if (assetId === null || assetId <= 0) {
      return apiErrorResponse("ID tài sản không hợp lệ", 400);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return apiErrorResponse("Dữ liệu JSON không hợp lệ", 400);
    }

    const result = await roomAssetService.update(
      session.user,
      assetId,
      body
    );

    return apiSuccessResponse(
      "Cập nhật tài sản thành công",
      result,
      200
    );
  } catch (error) {
    if (error instanceof RoomAssetError) {
      return apiErrorResponse(error.message, error.status);
    }

    console.error("PATCH room asset error:", error);
    return serverErrorResponse();
  }
}
