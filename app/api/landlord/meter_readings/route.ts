
// app/api/landlord/meter_readings/route.ts

import { Prisma, meter_readings } from "@/generated/prisma/client";
import { meterReadingService } from "@/lib/api/services/meter_readings/meter_reading.services";

import { ApiResponse, PaginationResult } from "@/lib/types/api.type";
import { apiErrorResponse, apiSuccessResponse, serverErrorResponse } from "@/lib/utils/api-error";
import { serializeBigInt } from "@/lib/utils/serialize";
import { NextRequest, NextResponse } from "next/server";

// Lấy danh sách chỉ số theo phòng và hợp đồng
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const roomId = searchParams.get("room_id");
    const contractId = searchParams.get("contract_id");
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);

    if (!roomId || !contractId) {
      return apiErrorResponse("Vui lòng cung cấp room_id và contract_id", 400)
    }

    const meterReadings = await meterReadingService.getMeterReading({
      room_id: BigInt(roomId),
      contract_id: BigInt(contractId),
      page,
      limit,
    });

    return apiSuccessResponse("Lấy danh sách chỉ số thành công!", meterReadings, 200);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_PAGINATION") {
      return apiErrorResponse("Thông tin phân trang không hợp lệ", 400)
    }

    return serverErrorResponse();
  }
}

// Tạo mới một bản ghi chỉ số
export async function POST(req: NextRequest) {
  try {
    const body: Prisma.meter_readingsCreateInput = await req.json();

    const meterReading = await meterReadingService.createMeterReading(body);

    return apiSuccessResponse("Thêm mới chỉ số thành công!", meterReading, 201)
  } catch (error) {
    return serverErrorResponse();
  }
}
