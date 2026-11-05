
import { auth } from "@/auth";
import { meterReadingService } from "@/lib/api/services/meter_readings/meter_reading.services";
import {
  apiErrorResponse,
  apiSuccessResponse,
} from "@/lib/utils/api-error";
import { parseId } from "@/lib/utils/function";

// API lấy chỉ số điện, nước hiện tại của phòng
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // // 1. Xác thực tài khoản
    // const session = await auth();

    // if (!session?.user?.id) {
    //   return apiErrorResponse("Xác thực thất bại!", 401);
    // }

    // // 2. Kiểm tra quyền chủ trọ
    // if (session.user.role !== "LANDLORD") {
    //   return apiErrorResponse(
    //     "Bạn không có quyền xem chỉ số phòng!",
    //     403
    //   );
    // }

    // 3. Lấy roomId từ params
    const { id } = await params;
    const roomId = parseId(id);

    if (!roomId) {
      return apiErrorResponse("RoomId không hợp lệ!", 400);
    }

    // 4. Gọi Service
    const result = await meterReadingService.getCurrentReadings(roomId);

    // 5. Trả kết quả
    return apiSuccessResponse(
      "Lấy chỉ số điện nước của phòng thành công",
      result,
      200
    );
  } catch (error) {
    console.error("GET /api/landlord/rooms/[id]/meter_readings:", error);

    if (error instanceof Error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        ROOM_NOT_FOUND: {
          message: "Không tìm thấy phòng",
          status: 404,
        },
        ACTIVE_CONTRACT_NOT_FOUND: {
          message: "Phòng hiện không có hợp đồng đang hoạt động",
          status: 404,
        },
      };

      const mappedError = errorMap[error.message];

      if (mappedError) {
        return apiErrorResponse(
          mappedError.message,
          mappedError.status
        );
      }
    }

    return apiErrorResponse("Đã xảy ra lỗi hệ thống", 500);
  }
}
