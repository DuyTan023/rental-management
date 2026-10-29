import { roomServiceService } from "@/lib/api/services/services/room_service.service";
import { routeContext } from "@/lib/types/api.type";
import { apiErrorResponse, apiSuccessResponse, serverErrorResponse } from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { NextRequest } from "next/server";

// Lấy danh sách lịch sử sử dụng dịch vụ của phòng
export async function GET(req: NextRequest, { params }: routeContext) {
  try {
    // Lấy id phòng
    const { id } = await params;
    const room_id = parseId(id);

    if (room_id === null) {
      return invalidIdResponse();
    }

      const room_services = await roomServiceService.getRoomServiceHistory(room_id);

    return apiSuccessResponse(
      "Lấy lịch sử áp dụng dịch vụ của phòng thành công!",
      room_services,
      200,
    );
  } catch (error) {
    return serverErrorResponse();
  }
}
