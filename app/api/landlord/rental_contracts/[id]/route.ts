import type { Prisma, rental_contracts } from "@/generated/prisma/client";
import { rentalContractService } from "@/lib/api/services/rental_contracts/rental_contracts.service";
import type { ApiResponse, routeContext } from "@/lib/types/api.type";
import { serverErrorResponse } from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { serializeBigInt } from "@/lib/utils/serialize";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const contractId = parseId(id);

    if (contractId === null) {
      return invalidIdResponse();
    }
    const rental_contract = await rentalContractService.getById(contractId);

    return NextResponse.json<ApiResponse<rental_contracts>>(
      {
        success: true,
        message: "Lấy hợp đồng thành công",
        data: serializeBigInt(rental_contract),
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Error && err.message === "RENTAL_CONTRACT_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không tìm thấy hợp đồng!",
          data: null,
        },
        { status: 404 },
      );
    }
    console.error("GET RENTAL CONTRAC ERROR:", err);
    return serverErrorResponse();
  }
}

export async function PUT(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const contractId = parseId(id);

    if (contractId === null) {
      return invalidIdResponse();
    }

    const body: Prisma.rental_contractsUpdateInput = await req.json();
    const rental_contract = await rentalContractService.updateRentalContract(
      contractId,
      body,
    );

    return NextResponse.json<ApiResponse<typeof rental_contract>>(
      {
        success: true,
        message: "Cập nhật thông tin hợp đồng thành công!",
        data: serializeBigInt(rental_contract),
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Error && err.message === "RENTAL_CONTRACT_EXISTS") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Thông tin bị trùng!",
          data: null,
        },
        { status: 409 },
      );
    } else if (
      err instanceof Error &&
      err.message === "RENTAL_CONTRACT_NOT_FOUND"
    ) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không tìm thấy hợp đồng!",
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
    const contractId = parseId(id);

    if (contractId === null) {
      return invalidIdResponse();
    }
    await rentalContractService.deleteRentalContract(contractId);

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: "Xóa hợp đồng thành công!",
      data: null,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "RENTAL_CONTRACT_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không tìm thấy hợp đồng!",
          data: null,
        },
        { status: 404 },
      );
    } else if (
      err instanceof Error &&
      err.message === "RENTAL_CONTRACT_IN_USE"
    ) {
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
