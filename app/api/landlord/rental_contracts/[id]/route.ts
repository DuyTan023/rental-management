import type { Prisma } from "@/generated/prisma/client";
import { rentalContractService } from "@/lib/api/services/rental_contracts/rental_contracts.service";
import type { routeContext } from "@/lib/types/api.type";
import {
  apiErrorResponse,
  apiSuccessResponse,
  serverErrorResponse,
} from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const contractId = parseId(id);

    if (contractId === null) {
      return invalidIdResponse();
    }
    const rental_contract = await rentalContractService.getById(contractId);

    return apiSuccessResponse("Lấy hợp đồng thành công", rental_contract, 200);
  } catch (err) {
    if (err instanceof Error && err.message === "RENTAL_CONTRACT_NOT_FOUND") {
      return apiErrorResponse("Không tìm thấy hợp đồng!", 404);
    }
    console.error("GET RENTAL CONTRAC ERROR:", err);
    return serverErrorResponse();
  }
}

export async function PATCH(req: NextRequest, { params }: routeContext) {
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

    return apiSuccessResponse(
      "Cập nhật thông tin hợp đồng thành công!",
      rental_contract,
      200,
    );
  } catch (err) {
    if (err instanceof Error && err.message === "RENTAL_CONTRACT_EXISTS") {
      return apiErrorResponse("Thông tin bị trùng!", 409);
    } else if (
      err instanceof Error &&
      err.message === "RENTAL_CONTRACT_NOT_FOUND"
    ) {
      return apiErrorResponse("Không tìm thấy hợp đồng!", 404);
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

    return apiSuccessResponse("Xóa hợp đồng thành công!", null, 200);
  } catch (err) {
    if (err instanceof Error && err.message === "RENTAL_CONTRACT_NOT_FOUND") {
      return apiErrorResponse("Không tìm thấy hợp đồng!", 404);
    } else if (
      err instanceof Error &&
      err.message === "RENTAL_CONTRACT_IN_USE"
    ) {
      return apiErrorResponse("Không thể xóa vì đang sử dụng!", 409);
    }
    return serverErrorResponse();
  }
}
