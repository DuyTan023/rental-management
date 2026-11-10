
import { auth } from "@/auth";
import { roomAssetService, RoomAssetError } from "@/lib/api/services/room-assets/room-asset.service";
import { apiErrorResponse, apiSuccessResponse, serverErrorResponse } from "@/lib/utils/api-error";
import { parseId } from "@/lib/utils/function";
import { NextRequest } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: Context
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiErrorResponse("Vui lòng đăng nhập", 401);
    }

    const { id } = await params;
    const roomId = parseId(id);

    if (roomId === null || roomId <= 0) {
      return apiErrorResponse("ID phòng không hợp lệ", 400);
    }

    const result = await roomAssetService.getRoomAssets(
      session.user,
      roomId
    );

    return apiSuccessResponse(
      "Lấy danh sách tài sản thành công",
      result,
      200
    );
  } catch (error) {
    if (error instanceof RoomAssetError) {
      return apiErrorResponse(error.message, error.status);
    }

    console.error("GET room assets error:", error);
    return serverErrorResponse();
  }
}

export async function POST(
  request: NextRequest,
  { params }: Context
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiErrorResponse("Vui lòng đăng nhập", 401);
    }

    const { id } = await params;
    const roomId = parseId(id);

    if (roomId === null || roomId <= 0) {
      return apiErrorResponse("ID phòng không hợp lệ", 400);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return apiErrorResponse("Dữ liệu JSON không hợp lệ", 400);
    }

    const result = await roomAssetService.create(
      session.user,
      roomId,
      body
    );

    return apiSuccessResponse(
      "Thêm tài sản thành công",
      result,
      201
    );
  } catch (error) {
    if (error instanceof RoomAssetError) {
      return apiErrorResponse(error.message, error.status);
    }

    console.error("POST room asset error:", error);
    return serverErrorResponse();
  }
}
