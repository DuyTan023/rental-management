
// // app/api/landlord/meter_readings/[id]/route.ts

// import { Prisma, meter_readings } from "@/generated/prisma/client";
// import { meterReadingService } from "@/lib/api/services/meter_readings/meter_reading.services";

import { ApiResponse } from "@/lib/types/api.type";
import { serverErrorResponse } from "@/lib/utils/api-error";
import { serializeBigInt } from "@/lib/utils/serialize";


// Lấy chi tiết chỉ số theo ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const meterReading = await meterReadingService.getById(BigInt(id));

    return apiSuccessResponse("Lấy chi tiết chỉ số thành công!", meterReading, 200);
  } catch (error) {
    //  console.error("GET meter reading error:", error);
    if (
      error instanceof Error &&
      error.message === "METER_READING_NOT_FOUND"
    ) {
      return apiErrorResponse("Không tìm thấy bản ghi chỉ số", 404)
    }

    return serverErrorResponse();
  }
}

// // Cập nhật bản ghi chỉ số
// export async function PUT(
//   req: NextRequest,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const { id } = await params;
//     const body: Prisma.meter_readingsUpdateInput = await req.json();

//     const meterReading = await meterReadingService.updateMeterReading(
//       BigInt(id),
//       body,
//     );

//     return apiSuccessResponse("Cập nhật chỉ số thành công!", meterReading, 200);
//   } catch (error) {
//     if (
//       error instanceof Error &&
//       error.message === "METER_READING_NOT_FOUND"
//     ) {
//      return apiErrorResponse("Không tìm thấy bản ghi chỉ số", 404);
//     }

//     return serverErrorResponse();
//   }
// }

// // Xóa bản ghi chỉ số
// export async function DELETE(
//   req: NextRequest,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const { id } = await params;
//     const meterReading = await meterReadingService.deleteMeterReading(
//       BigInt(id),
//     );

//     return apiSuccessResponse("Xóa chỉ số thành công!", meterReading, 200)
//   } catch (error) {
//     if (
//       error instanceof Error &&
//       error.message === "METER_READING_NOT_FOUND"
//     ) {
//         return apiErrorResponse("Không tìm thấy bản ghi chỉ số", 404);
//     }

//     return serverErrorResponse();
//   }
// }

import { auth } from "@/auth";
import { meterReadingService } from "@/lib/api/services/meter_readings/meter_reading.services";
import {
  apiErrorResponse,
  apiSuccessResponse,
} from "@/lib/utils/api-error";
import { parseId } from "@/lib/utils/function";
import { NextRequest } from "next/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

type UpdateStatusBody = {
  status: "APPROVED" | "REJECTED" | "WITHDRAWN";
  note?: string;
};

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // // 1. Xác thực
    // const session = await auth();

    // if (!session?.user?.id) {
    //   return apiErrorResponse("Xác thực thất bại!", 401);
    // }

    // // 2. Kiểm tra quyền chủ trọ
    // if (session.user.role !== "LANDLORD") {
    //   return apiErrorResponse("Bạn không có quyền thực hiện thao tác này!", 403);
    // }

    // 3. Lấy và kiểm tra ID
    const { id } = await params;
    const readingId = parseId(id);

    if (!readingId) {
      return apiErrorResponse("ID báo cáo không hợp lệ!", 400);
    }

    // 4. Lấy dữ liệu request
    const body = (await request.json()) as UpdateStatusBody;

    if (!["APPROVED", "REJECTED"].includes(body.status)) {
      return apiErrorResponse("Trạng thái cập nhật không hợp lệ!", 400);
    }

    if (
      body.status === "REJECTED" &&
      (!body.note || !body.note.trim())
    ) {
      return apiErrorResponse("Vui lòng nhập lý do từ chối!", 400);
    }

    // 5. Gọi service
    const result = await meterReadingService.updateStatus(
      readingId,
      body.status,
      body.note
    );

    return apiSuccessResponse(
      body.status === "APPROVED"
        ? "Chấp nhận báo cáo thành công!"
        : "Từ chối báo cáo thành công!",
      result, 201
    );
  } catch (error) {
    console.error("PATCH meter reading error:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "METER_READING_NOT_FOUND":
          return apiErrorResponse("Không tìm thấy báo cáo chỉ số!", 404);

        case "METER_READING_ALREADY_PROCESSED":
          return apiErrorResponse(
            "Báo cáo này đã được xử lý trước đó!",
            409
          );

        case "REJECTION_REASON_REQUIRED":
          return apiErrorResponse("Vui lòng nhập lý do từ chối!", 400);

        case "SERVER_ERROR":
          return apiErrorResponse("Đã xảy ra lỗi máy chủ!", 500);
      }
    }

    return apiErrorResponse("Đã xảy ra lỗi máy chủ!", 500);
  }
}
