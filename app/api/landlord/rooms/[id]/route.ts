import type { rooms } from "@/generated/prisma/client";
import { roomService } from "@/lib/api/services/rooms/room.service";
import type { ApiResponse } from "@/lib/types/api.type";
import { serverErrorResponse } from "@/lib/utils/api-error";
import { serializeBigInt } from "@/lib/utils/serialize";
import { NextResponse, type NextRequest } from "next/server";
type routeContext = { params: Promise<{ id: string }> };

// hàm kiểm tra tính hợp kệ của id
function parseRoomId(id: string): bigint | null {
  if (!/^\d+$/.test(id)) {
    return null;
  }

  return BigInt(id);
}

// Hàm trả về lỗi khi id không hợp lệ
function invalidRoomIdResponse() {
  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      message: "ID phòng không hợp lệ!",
      data: null,
    },
    { status: 400 },
  );
}

export async function GET(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const roomId = parseRoomId(id);

    if (roomId === null) {
      return invalidRoomIdResponse();
    }
    const room = await roomService.getRooomById(roomId);
    return NextResponse.json<ApiResponse<rooms>>(
      {
        success: true,
        message: "Lấy phòng trọ thành công",
        data: room,
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Error && err.message === "ROOM_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không tìm thấy phòng trọ!",
          data: null,
        },
        { status: 404 },
      );
    }

    return serverErrorResponse();
  }
}

export async function PUT(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const roomId = parseRoomId(id);

    if (roomId === null) {
      return invalidRoomIdResponse();
    }

    const body = await req.json();
    const room = await roomService.updateRoom(roomId, body);

    return NextResponse.json<ApiResponse<typeof room>>(
      {
        success: true,
        message: "Cập nhật thông tin phòng trọ thành công!",
        data: serializeBigInt(room),
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Error && err.message === "ROOM_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không tìm thấy phòng trọ!",
          data: null,
        },
        { status: 404 },
      );
    }

    return serverErrorResponse();
  }
}

export async function DELETE(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const roomId = parseRoomId(id);

    if (roomId === null) {
      return invalidRoomIdResponse();
    }
    await roomService.deleteRoom(roomId);

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: "Xóa phòng thuê thành công!",
      data: null,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "ROOM_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không tìm thấy phòng trọ!",
          data: null,
        },
        { status: 404 },
      );
    } else if (err instanceof Error && err.message === "ROOM_IN_USE") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không thể xóa vì đang sử dụng!",
          data: null,
        },
        { status: 409 },
      );
    }
    return serverErrorResponse();
  }
}
