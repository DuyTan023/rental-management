
import { auth } from "@/auth";
import { meterReadingService } from "@/lib/api/services/meter_readings/meter_reading.services";
import {
  apiErrorResponse,
  apiSuccessResponse,
} from "@/lib/utils/api-error";
import { parseId } from "@/lib/utils/function";

// API lấy chỉ số điện, nước ban đầu lúc bàn giao hợp đồng
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Xác thực tài khoản
    const session = await auth();

    if (!session?.user?.id) {
      return apiErrorResponse("Xác thực thất bại!", 401);
    }

    // 2. Kiểm tra quyền chủ trọ
    if (session.user.role !== "LANDLORD") {
      return apiErrorResponse(
        "Bạn không có quyền xem chỉ số bàn giao!",
        403
      );
    }

    // 3. Lấy contractId từ params
    const { id } = await params;
    const contractId = parseId(id);

    if (!contractId) {
      return apiErrorResponse("ContractId không hợp lệ!", 400);
    }

    // 4. Gọi Service
    const result =
      await meterReadingService.getInitialReadings(contractId);

    // 5. Trả kết quả
    return apiSuccessResponse(
      "Lấy chỉ số bàn giao hợp đồng thành công",
      result,
      200
    );
  } catch (error) {
    console.error(
      "GET /api/landlord/rental_contracts/[id]/meter_readings/initial:",
      error
    );

    if (error instanceof Error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        CONTRACT_NOT_FOUND: {
          message: "Không tìm thấy hợp đồng",
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
