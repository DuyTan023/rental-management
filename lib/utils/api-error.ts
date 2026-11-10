import { NextResponse } from "next/server";
import type { ApiResponse } from "../types/api.type";
import { serializeBigInt } from "./serialize";
import { OvernightStayError } from "../api/services/overnight-stay/overnight-stay.service";

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

export function apiErrorResponse(message: string, status: number) {
  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      message: message,
      data: null,
    },
    { status: status },
  );
}

export function apiSuccessResponse<T>(
  message: string,
  data: T,
  status: number,
) {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      message: message,
      data: serializeBigInt(data),
    },
    { status: status },
  );
}

export function errorResponse(error: unknown) {
  if (error instanceof OvernightStayError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.status }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 400 }
    );
  }

  console.error("Overnight stay API error:", error);

  return NextResponse.json(
    {
      success: false,
      message: "Đã xảy ra lỗi máy chủ",
    },
    { status: 500 }
  );
}