// api/app/landlord/service/[id]/route.ts

import { serviceService } from "@/lib/api/services/services/service.service";
import type { ApiResponse, routeContext } from "@/lib/types/api.type";
import { serverErrorResponse } from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { serializeBigInt } from "@/lib/utils/serialize";
import { NextResponse, type NextRequest } from "next/server";

// Lấy dịch vụ theo id
// Cập nhật thông tin dịch vụ
// Bật tắt dịch vụ

// Lấy dịch vụ theo id
export async function GET(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const serviceId = parseId(id);

    if (serviceId === null) {
      return invalidIdResponse();
    }

    const service = await serviceService.getServiceById(serviceId);

    return NextResponse.json<ApiResponse<typeof service>>(
      {
        success: true,
        message: "Lấy dịch vụ thành công",
        data: serializeBigInt(service),
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "SERVICE_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không tìm thấy dịch vụ",
          data: null,
        },
        { status: 404 },
      );
    }

    return serverErrorResponse();
  }
}

// Cập nhật thông tin dịch vụ
