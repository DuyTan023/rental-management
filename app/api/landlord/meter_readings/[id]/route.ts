
// app/api/landlord/meter_readings/[id]/route.ts

import { Prisma, meter_readings } from "@/generated/prisma/client";
import { meterReadingService } from "@/lib/api/services/meter_readings/meter_reading.services";

import { ApiResponse } from "@/lib/types/api.type";
import { apiErrorResponse, apiSuccessResponse, serverErrorResponse } from "@/lib/utils/api-error";
import { serializeBigInt } from "@/lib/utils/serialize";
import { NextRequest, NextResponse } from "next/server";

// Lấy chi tiết chỉ số theo ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const meterReading = await meterReadingService.getById(BigInt(id));

    return apiSuccessResponse("Lấy chi tiết chỉ số thành công!", meterReading, 200);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "METER_READING_NOT_FOUND"
    ) {
      return apiErrorResponse("Không tìm thấy bản ghi chỉ số", 404)
    }

    return serverErrorResponse();
  }
}

// Cập nhật bản ghi chỉ số
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body: Prisma.meter_readingsUpdateInput = await req.json();

    const meterReading = await meterReadingService.updateMeterReading(
      BigInt(id),
      body,
    );

    return apiSuccessResponse("Cập nhật chỉ số thành công!", meterReading, 200);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "METER_READING_NOT_FOUND"
    ) {
     return apiErrorResponse("Không tìm thấy bản ghi chỉ số", 404);
    }

    return serverErrorResponse();
  }
}

// Xóa bản ghi chỉ số
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const meterReading = await meterReadingService.deleteMeterReading(
      BigInt(id),
    );

    return apiSuccessResponse("Xóa chỉ số thành công!", meterReading, 200)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "METER_READING_NOT_FOUND"
    ) {
        return apiErrorResponse("Không tìm thấy bản ghi chỉ số", 404);
    }

    return serverErrorResponse();
  }
}
