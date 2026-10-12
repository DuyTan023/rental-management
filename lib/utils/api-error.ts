import { NextResponse } from "next/server";
import type { ApiResponse } from "../types/api.type";

// hàm trả về khi lỗi derver
export function serverErrorResponse() {
  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      message: "Lỗi server!",
      data: null,
    },
    {
      status: 500,
    },
  );
}

export function badRequestResponse(message: string = "Dữ liệu không hợp lệ") {
  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      message,
      data: null,
    },
    { status: 400 },
  );
}
