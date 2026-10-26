//api/landloard/rooms/[id]/route.ts

import { roomService } from "@/lib/api/services/rooms/room.service";
import type { routeContext } from "@/lib/types/api.type";
import {
  apiErrorResponse,
  apiSuccessResponse,
  serverErrorResponse,
} from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const roomId = parseId(id);

    if (roomId === null) {
      return invalidIdResponse();
    }
    const room = await roomService.getRooomById(roomId);

    return apiSuccessResponse("Lấy phòng trọ thành công", room, 200);
  } catch (err) {
    if (err instanceof Error && err.message === "ROOM_NOT_FOUND") {
      return apiErrorResponse("Không tìm thấy phòng trọ!", 404);
    }

    return serverErrorResponse();
  }
}

export async function PUT(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const roomId = parseId(id);

    if (roomId === null) {
      return invalidIdResponse();
    }

    const body = await req.json();
    const room = await roomService.updateRoom(roomId, body);

    return apiSuccessResponse(
      "Cập nhật thông tin phòng trọ thành công!",
      room,
      200,
    );
  } catch (err) {
    if (err instanceof Error && err.message === "ROOM_NOT_FOUND") {
      return apiErrorResponse("Không tìm thấy phòng trọ!", 404);
    }

    return serverErrorResponse();
  }
}

export async function DELETE(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const roomId = parseId(id);

    if (roomId === null) {
      return invalidIdResponse();
    }
    await roomService.deleteRoom(roomId);

    return apiSuccessResponse("Xóa phòng thuê thành công", null, 200);
  } catch (err) {
    if (err instanceof Error && err.message === "ROOM_NOT_FOUND") {
      return apiErrorResponse("Không tìm thấy phòng trọ", 404);
    } else if (err instanceof Error && err.message === "ROOM_IN_USE") {
      return apiErrorResponse("Không thể xóa vì đang sử dụng", 409);
    }
    return serverErrorResponse();
  }
}
