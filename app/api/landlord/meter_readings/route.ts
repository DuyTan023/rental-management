import { auth } from "@/auth";
import {
  CreateMeterReadingInput,
  meterReadingService,
} from "@/lib/api/services/meter_readings/meter_reading.services";
import {
  apiErrorResponse,
  apiSuccessResponse,
} from "@/lib/utils/api-error";
import { parseId } from "@/lib/utils/function";

type InitialHandoverInput = Extract<
  CreateMeterReadingInput,
  { type: "INITIAL_HANDOVER" }
>;

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiErrorResponse("Xác thực thất bại!", 401);
    }

    const userID = parseId(session.user.id);

    if (!userID) {
      return apiErrorResponse("UserId không hợp lệ", 401);
    }

    const body = await req.json();

    if (
      body.type !== "INITIAL_HANDOVER" &&
      body.type !== "MONTHLY_REPORT"
    ) {
      return apiErrorResponse("Nghiệp vụ không hợp lệ!", 400);
    }

    // const readingDate = new Date(body.readingDate);

    // if (Number.isNaN(readingDate.getTime())) {
    //   return apiErrorResponse("Ngày ghi nhận không hợp lệ!", 400);
    // }

    if (
        typeof body.readingDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(body.readingDate)
      ) {
        return apiErrorResponse("Ngày ghi nhận không hợp lệ!", 400);
      }

      const readingDate = new Date(`${body.readingDate}T00:00:00.000Z`);

      if (
        Number.isNaN(readingDate.getTime()) ||
        readingDate.toISOString().slice(0, 10) !== body.readingDate
      ) {
        return apiErrorResponse("Ngày ghi nhận không hợp lệ!", 400);
      }

    const roomId = parseId(body.roomId);

    if (!roomId) {
      return apiErrorResponse("RoomId không hợp lệ!", 400);
    }

    let input: CreateMeterReadingInput;

    if (body.type === "INITIAL_HANDOVER") {
      if (!Array.isArray(body.readings) || body.readings.length !== 2) {
        return apiErrorResponse(
          "Cần cung cấp đủ chỉ số điện và nước bàn giao!",
          400
        );
      }

      const electricity = body.readings.find(
        (item: any) => item.meterType === "ELECTRICITY"
      );

      const water = body.readings.find(
        (item: any) => item.meterType === "WATER"
      );
      

      const contractId = parseId(body.contractId);
      const electricityServiceId = parseId(electricity?.serviceId);
      const waterServiceId = parseId(water?.serviceId);
      

      if (
        !contractId ||
        !electricity ||
        !water ||
        !electricityServiceId ||
        !waterServiceId
      ) {
        return apiErrorResponse(
          "Thông tin hợp đồng hoặc dịch vụ bàn giao không hợp lệ!",
          400
        );
      }

      const electricityValue = Number(electricity.newValue);
      const waterValue = Number(water.newValue);

      if (
        !Number.isFinite(electricityValue) ||
        !Number.isFinite(waterValue) ||
        electricityValue < 0 ||
        waterValue < 0
      ) {
        return apiErrorResponse("Chỉ số bàn giao không hợp lệ!", 400);
      }

      const readings: InitialHandoverInput["readings"] = [
        {
          meterType: "ELECTRICITY",
          serviceId: electricityServiceId,
          newValue: electricityValue,
        },
        {
          meterType: "WATER",
          serviceId: waterServiceId,
          newValue: waterValue,
        },
      ];

      input = {
        type: "INITIAL_HANDOVER",
        roomId,
        contractId,
        readingDate,
        readings,
        note:
          typeof body.note === "string"
            ? body.note.trim() || null
            : null,
            };
    } else {
      const serviceId = parseId(body.serviceId);
      const newValue = Number(body.newValue);

      if (!serviceId) {
        return apiErrorResponse("ServiceId không hợp lệ!", 400);
      }

      if (
        body.meterType !== "ELECTRICITY" &&
        body.meterType !== "WATER"
      ) {
        return apiErrorResponse("Loại đồng hồ không hợp lệ!", 400);
      }

      if (!Number.isFinite(newValue) || newValue < 0) {
        return apiErrorResponse("Chỉ số mới không hợp lệ!", 400);
      }

      if (
        typeof body.imageUrl !== "string" ||
        !body.imageUrl.trim()
      ) {
        return apiErrorResponse("Ảnh chỉ số là bắt buộc!", 400);
      }

      const periodMonth = Number(body.periodMonth);
      const periodYear = Number(body.periodYear);

      if (
        !Number.isInteger(periodMonth) ||
        periodMonth < 1 ||
        periodMonth > 12 ||
        !Number.isInteger(periodYear) ||
        periodYear < 2000
      ) {
        return apiErrorResponse("Kỳ báo cáo không hợp lệ!", 400);
      }

        input = {
        type: "MONTHLY_REPORT",
        roomId,
        serviceId,
        meterType: body.meterType,
        readingDate,
        periodMonth,
        periodYear,
        newValue,
        imageUrl: body.imageUrl,
      };
    }

    const result = await meterReadingService.create(userID, input);

    return apiSuccessResponse(
      "Tạo báo cáo chỉ số thành công",
      result,
      201
    );
  } catch (error) {
    console.error("POST /api/meter-readings:", error);

    if (error instanceof Error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        USER_NOT_FOUND: {
          message: "Không tìm thấy tài khoản",
          status: 404,
        },
        USER_INACTIVE: {
          message: "Tài khoản hiện không hoạt động",
          status: 403,
        },
        FORBIDDEN: {
          message: "Bạn không có quyền thực hiện",
          status: 403,
        },
        ROOM_NOT_FOUND: {
          message: "Không tìm thấy phòng",
          status: 404,
        },
        ACTIVE_CONTRACT_NOT_FOUND: {
          message: "Phòng không có hợp đồng đang hoạt động",
          status: 404,
        },
        PROFILE_NOT_FOUND: {
          message: "Không tìm thấy hồ sơ người thuê",
          status: 404,
        },
        NOT_CONTRACT_TENANT: {
          message: "Bạn không thuộc hợp đồng thuê phòng này",
          status: 403,
        },
        SUBMISSION_PERIOD_CLOSED: {
          message: "Đã hết thời gian gửi báo cáo",
          status: 400,
        },
        READING_ALREADY_SUBMITTED: {
          message: "Đã có báo cáo cho loại chỉ số này trong kỳ",
          status: 409,
        },
        INITIAL_READING_NOT_FOUND: {
          message: "Chưa có chỉ số bàn giao hoặc chỉ số gốc hợp lệ",
          status: 409,
        },
        INVALID_READING_VALUE: {
          message: "Chỉ số mới không được nhỏ hơn chỉ số cũ",
          status: 400,
        },
        INVALID_INITIAL_READINGS: {
          message: "Cần có đủ chỉ số điện và nước bàn giao",
          status: 400,
        },
        INVALID_METER_TYPE: {
          message: "Loại đồng hồ không hợp lệ",
          status: 400,
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

// Lấy danh sách phòng có hợp đồng ACTIVE và báo cáo chỉ số theo kỳ
export async function GET(req: Request) {
  try {
    // 1. Xác thực
    // const session = await auth();

    // if (!session?.user?.id) {
    //   return apiErrorResponse("Xác thực thất bại!", 401);
    // }

    // // 2. Kiểm tra quyền chủ trọ
    // if (session.user.role !== "LANDLORD") {
    //   return apiErrorResponse(
    //     "Bạn không có quyền xem danh sách báo cáo!",
    //     403
    //   );
    // }

    // 3. Lấy tháng và năm từ query
    const { searchParams } = new URL(req.url);

    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    if (!monthParam || !yearParam) {
      return apiErrorResponse(
        "Vui lòng cung cấp tháng và năm báo cáo!",
        400
      );
    }

    const month = Number(monthParam);
    const year = Number(yearParam);

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2000
    ) {
      return apiErrorResponse(
        "Tháng hoặc năm báo cáo không hợp lệ!",
        400
      );
    }

    // 4. Gọi Service
    const result = await meterReadingService.getReadingsByPeriod(
      month,
      year
    );

    // 5. Trả kết quả
    return apiSuccessResponse(
      "Lấy danh sách báo cáo chỉ số thành công",
      result,
      200
    );
  } catch (error) {
    console.error("GET /api/meter-readings:", error);

    if (
      error instanceof Error &&
      error.message === "INVALID_PERIOD"
    ) {
      return apiErrorResponse(
        "Tháng hoặc năm báo cáo không hợp lệ!",
        400
      );
    }

    return apiErrorResponse("Đã xảy ra lỗi hệ thống", 500);
  }
}