
import { auth } from "@/auth";
import { roomAssetService, RoomAssetError } from "@/lib/api/services/room-assets/room-asset.service";
import { apiErrorResponse, apiSuccessResponse, serverErrorResponse } from "@/lib/utils/api-error";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiErrorResponse("Vui lòng đăng nhập", 401);
    }

    const result = await roomAssetService.getTenantAssets(
      session.user
    );

    return apiSuccessResponse(
      "Lấy danh sách tài sản phòng thuê thành công",
      result,
      200
    );
  } catch (error) {
    if (error instanceof RoomAssetError) {
      return apiErrorResponse(error.message, error.status);
    }

    console.error("GET tenant assets error:", error);
    return serverErrorResponse();
  }
}
