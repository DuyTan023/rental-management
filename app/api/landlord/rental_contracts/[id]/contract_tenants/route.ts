import { Prisma } from "@/generated/prisma/client";
import { contractTenantService } from "@/lib/api/services/contract_tenants/contract_tenant.service";
import { routeContext } from "@/lib/types/api.type";
import {
  apiErrorResponse,
  apiSuccessResponse,
  serverErrorResponse,
} from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { serializeBigInt } from "@/lib/utils/serialize";
import { NextRequest } from "next/server";

type RequestBody = {
  profile_id?: string;
  role?: "REPRESENTATIVE" | "MEMBER";
};

export async function POST(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const contractId = parseId(id);

    if (contractId == null) {
      return invalidIdResponse();
    }

    const body = (await req.json()) as RequestBody;

    if (!body.profile_id) {
      return apiErrorResponse("Vui lòng chọn hồ sơ người thuê.", 400);
    }

    const profileId = parseId(body.profile_id);

    if (profileId == null) {
      return apiErrorResponse("ID hồ sơ không hợp lệ.", 400);
    }

    const role = body.role ?? "MEMBER";

    if (role !== "MEMBER" && role !== "REPRESENTATIVE") {
      return apiErrorResponse("Vai trò người thuê không hợp lệ.", 400);
    }

    const tenant = await contractTenantService.createContractTenant(
      contractId,
      profileId,
      role,
    );

    return apiSuccessResponse(
      "Thêm người thuê vào hợp đồng thành công.",
      serializeBigInt(tenant),
      201,
    );
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "CONTRACT_NOT_FOUND":
          return apiErrorResponse("Không tìm thấy hợp đồng.", 404);

        case "ROOM_CAPACITY_EXCEEDED":
          return apiErrorResponse(
            "Phòng đã đủ số người theo sức chứa cho phép. Không thể thêm người thuê.",
            409,
          );

        case "CONTRACT_TENANT_EXISTS":
          return apiErrorResponse(
            "Người thuê này đã được thêm vào hợp đồng.",
            409,
          );

        case "INVALID_RELATION":
        case "RELATED_RECORD_NOT_FOUND":
          return apiErrorResponse(
            "Không tìm thấy hồ sơ hoặc dữ liệu liên kết không hợp lệ.",
            400,
          );
      }
    }

    return serverErrorResponse();
  }
}