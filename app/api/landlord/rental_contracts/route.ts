import type { rental_contracts } from "@/generated/prisma/client";
import type { rental_contract_status } from "@/generated/prisma/enums";
import type {
  CreateFullContractParams,
  ExpirationFilter,
} from "@/lib/api/repositories/rental_contracts/rental_contracts.repository";
import { rentalContractService } from "@/lib/api/services/rental_contracts/rental_contracts.service";
import type { ApiResponse, PaginationResult } from "@/lib/types/api.type";
import { badRequestResponse, serverErrorResponse } from "@/lib/utils/api-error";
import { serializeBigInt } from "@/lib/utils/serialize";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page")
      ? Number(searchParams.get("page"))
      : undefined;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : undefined;
    const keyword = searchParams.get("keyword") || undefined;
    const status =
      (searchParams.get("status") as rental_contract_status) || undefined;
    const startDateFrom = searchParams.get("startDateFrom") || undefined;
    const startDateTo = searchParams.get("startDateTo") || undefined;
    const expirationFilter =
      (searchParams.get("expirationFilter") as ExpirationFilter) || undefined;
    const expiringInDays = searchParams.get("expiringInDays")
      ? Number(searchParams.get("expiringInDays"))
      : undefined;

    const result = await rentalContractService.getRentalContracts({
      page,
      limit,
      keyword,
      status,
      startDateFrom,
      startDateTo,
      expirationFilter,
      expiringInDays,
    });

    return NextResponse.json<ApiResponse<PaginationResult<rental_contracts>>>(
      {
        success: true,
        message: "Lấy danh sách hợp đồng thành công",
        data: serializeBigInt(result),
      },
      { status: 200 },
    );
  } catch (error) {
    return serverErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateFullContractParams = await req.json();
    if (
      !body.inputRentalContract ||
      !body.tenants ||
      body.tenants.length === 0
    ) {
      return badRequestResponse(
        "Vui lòng cung cấp thông tin hợp đồng và ít nhất 1 người thuê.",
      );
    }

    const rental_contract =
      await rentalContractService.createRentalContract(body);

    return NextResponse.json<ApiResponse<typeof rental_contract>>(
      {
        success: true,
        message: "Tạo mới hợp đồng thành công",
        data: serializeBigInt(rental_contract),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "RENTAL_CONTRACT_EXISTS") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Lỗi trùng lặp tạo hợp đồng!",
          data: null,
        },
        {
          status: 409,
        },
      );
    }

    return serverErrorResponse();
  }
}
