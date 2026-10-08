import { NextResponse } from "next/server";
import type { ApiResponse } from "../types/api.type";

// hàm kiểm tra tính hợp kệ của id
export function parseId(id: string): bigint | null {
  if (!/^\d+$/.test(id)) {
    return null;
  }

  return BigInt(id);
}

// Hàm trả về lỗi khi id không hợp lệ trong API
export function invalidIdResponse() {
  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      message: "ID phòng không hợp lệ!",
      data: null,
    },
    { status: 400 },
  );
}
