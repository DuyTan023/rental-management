
import { auth } from "@/auth";
import { tenantMeterReadingService } from "@/lib/api/services/tenant/tenant_meter_reading.services";
import {
  apiErrorResponse,
  apiSuccessResponse,
} from "@/lib/utils/api-error";
import { parseId } from "@/lib/utils/function";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Xác thực
    const session = await auth();

    if (!session?.user.id) {
      return apiErrorResponse(
        "Xác thực thất bại!",
        401
      );
    }

    // 2. Parse userId
    const userId = parseId(session.user.id);

    if (!userId) {
      return apiErrorResponse(
        "UserId không hợp lệ!",
        401
      );
    }

    // 3. Gọi Service
    const result =
      await tenantMeterReadingService.getMyMeterReadings(
        userId
      );

    // 4. Trả kết quả
    return apiSuccessResponse(
      "Lấy dữ liệu báo cáo chỉ số thành công",
      result,
      200
    );
  } catch (error) {
    console.error(
      "GET /api/tenant/meter_readings:",
      error
    );

    if (error instanceof Error) {
      const errorMap: Record<
        string,
        { message: string; status: number }
      > = {
        USER_NOT_FOUND: {
          message: "Không tìm thấy tài khoản",
          status: 404,
        },

        USER_INACTIVE: {
          message: "Tài khoản hiện không hoạt động",
          status: 403,
        },

        FORBIDDEN: {
          message: "Bạn không có quyền truy cập chức năng này",
          status: 403,
        },

        PROFILE_NOT_FOUND: {
          message: "Không tìm thấy hồ sơ người thuê",
          status: 404,
        },

        ACTIVE_CONTRACT_NOT_FOUND: {
          message: "Bạn hiện không có hợp đồng thuê đang hoạt động",
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

    return apiErrorResponse(
      "Đã xảy ra lỗi hệ thống",
      500
    );
  }
}
