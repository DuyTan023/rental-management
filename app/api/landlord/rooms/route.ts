import type { rooms } from "@/generated/prisma/client";
import { roomService } from "@/lib/api/services/rooms/room.service";
import type { PaginationResult } from "@/lib/types/api.type";
import { ApiResponse } from "@/lib/types/api.type";
import { serverErrorResponse } from "@/lib/utils/api-error";
import { serializeBigInt } from "@/lib/utils/serialize";
import { NextRequest, NextResponse } from "next/server";

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

    return NextResponse.json<ApiResponse<PaginationResult<rooms>>>(
      {
        success: true,
        message: "Lấy danh sách phòng trọ thành công",
        data: serializeBigInt(rooms),
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("GET /api/landlord/rooms ERROR:", err);
    return serverErrorResponse;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const room = await roomService.createRoom(body);

    return NextResponse.json<ApiResponse<typeof room>>(
      {
        success: true,
        message: "Tạo phòng thuê thành công",
        data: serializeBigInt(room),
      },
      {
        status: 201,
      },
    );
  } catch (err) {
    if (err instanceof Error && err.message === "ROOM_EXISTS") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Phòng thuê đã tồn tại!",
          data: null,
        },
        {
          status: 409,
        },
      );
    }

    return serverErrorResponse;
  }
}
