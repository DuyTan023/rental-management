// api/app/landlord/rooms/[id]/services/[service_id]/route.ts

import { roomServiceService } from "@/lib/api/services/services/room_service.service";
import {
  apiErrorResponse,
  apiSuccessResponse,
  serverErrorResponse,
} from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { NextRequest } from "next/server";

// Lấy giá dịch vụ của phòng theo ngày
export type roomServiceRouteContext = {
  params: Promise<{
    id: string;
    service_id: string;
  }>;
};

export async function GET(
  req: NextRequest,
  { params }: roomServiceRouteContext,
) {
  try {
    const { id, service_id } = await params;

    const roomId = parseId(id);
    const serviceId = parseId(service_id);

    if (roomId === null || serviceId === null) {
      return invalidIdResponse();
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return apiErrorResponse("Vui lòng cung cấp ngày cần tra cứu", 400);
    }

    const date = new Date(dateParam);

    // Kiểm tra ngày hợp lệ
    if (Number.isNaN(date.getTime())) {
      return apiErrorResponse("Dữ liệu không hợp lệ", 400);
    }

    const room_service = await roomServiceService.getRoomServiceByDate(
      roomId,
      serviceId,
      date,
    );

    return apiSuccessResponse(
      "Lấy dịch vụ theo ngày tháng thành công",
      room_service,
      200,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "ROOM_SERVICE_NOT_FOUND") {
      return apiErrorResponse("Không tìm thấy dịch vụ phòng", 404);
    }

    if (error instanceof Error && error.message === "INVALID_DATE") {
      return apiErrorResponse("Ngày không hợp lệ", 400);
    }
    return serverErrorResponse();
  }
}

// Ngừng sử dụng dịch vụ của phòng
export async function PATCH(
  req: NextRequest,
  { params }: roomServiceRouteContext,
) {
  try {
    const { id, service_id } = await params;

    // Lấy ID phòng và ID bản ghi dịch vụ
    const roomId = parseId(id);
    const serviceId = parseId(service_id);

    if (roomId === null || serviceId === null) {
      return invalidIdResponse();
    }

    // Lấy ngày kết thúc từ request body
    const body = await req.json();
    const { effective_to } = body;

    if (!effective_to) {
      return apiErrorResponse("Vui lòng cung cấp ngày kết thúc dịch vụ", 400);
    }

    const effectiveTo = new Date(effective_to);

    if (Number.isNaN(effectiveTo.getTime())) {
      return apiErrorResponse("Ngày kết thúc không hợp lệ", 400);
    }

    // Ngừng dịch vụ
    const result = await roomServiceService.stopRoomService(
      serviceId,
      effectiveTo,
    );

    return apiSuccessResponse(
      "Ngừng sử dụng dịch vụ của phòng thành công",
      result,
      200,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "ROOM_SERVICE_NOT_FOUND") {
      return apiErrorResponse("Không tìm thấy dịch vụ phòng", 404);
    }

    if (
      error instanceof Error &&
      error.message === "ROOM_SERVICE_ALREADY_STOPPED"
    ) {
      return apiErrorResponse("Dịch vụ phòng đã ngừng sử dụng", 400);
    }

    if (error instanceof Error && error.message === "INVALID_EFFECTIVE_TO") {
      return apiErrorResponse(
        "Ngày kết thúc phải sau ngày bắt đầu áp dụng",
        400,
      );
    }

    return serverErrorResponse();
  }
}
