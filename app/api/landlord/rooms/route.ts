import { roomService } from "@/lib/api/services/rooms/room.service";
import {
  apiErrorResponse,
  apiSuccessResponse,
  serverErrorResponse,
} from "@/lib/utils/api-error";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = Number(searchParams.get("page"));
    const limitParam = Number(searchParams.get("limit"));
    const keyword = searchParams.get("keyword") || undefined;

    // Tránh lỗi nhập ký tự thì cho về 1 hết
    const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

    // Giới hạn giá trị 100 mẫu tin tránh limit=1000000
    const limit =
      Number.isInteger(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 10;

    const rooms = await roomService.getRoom({ page, limit, keyword });

    return apiSuccessResponse("Lấy danh sách phòng trọ thành công", rooms, 200);
  } catch (err) {
    return serverErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const room = await roomService.createRoom(body);

    return apiSuccessResponse("Tạo phòng thuê thành công", room, 201);
  } catch (err) {
    if (err instanceof Error && err.message === "ROOM_EXISTS") {
      return apiErrorResponse("Phòng thuê đã tồn tại!", 409);
    }

    return serverErrorResponse();
  }
}
