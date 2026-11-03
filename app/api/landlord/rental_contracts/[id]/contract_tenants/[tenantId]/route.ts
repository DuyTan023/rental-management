
import { NextRequest } from "next/server";



import { contractTenantService } from "@/lib/api/services/contract_tenants/contract_tenant.service";
import { parseId } from "@/lib/utils/function";
import { apiErrorResponse, apiSuccessResponse } from "@/lib/utils/api-error";

type RouteContext = {
  params: Promise<{
    id: string;
    tenantId: string;
  }>;
};

export async function PATCH(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id, tenantId } = await params;

    const contractId = parseId(id);
    const contractTenantId = parseId(tenantId);

    if (contractId === null || contractTenantId === null) {
      return apiErrorResponse("ID không hợp lệ.", 400);
    }

    const result = await contractTenantService.leaveContract(
      contractId,
      contractTenantId,
    );

    return apiSuccessResponse(
      "Người thuê rời hợp đồng thành công",
      result,
      200
    );
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "CONTRACT_NOT_FOUND":
          return apiErrorResponse("Không tìm thấy hợp đồng.", 404);

        case "CONTRACT_NOT_ACTIVE":
          return apiErrorResponse(
            "Chỉ có thể cho người thuê rời hợp đồng đang hoạt động.",
            400,
          );

        case "CONTRACT_TENANT_NOT_FOUND_OR_INACTIVE":
        case "CONTRACT_TENANT_NOT_FOUND":
          return apiErrorResponse(
            "Không tìm thấy người thuê đang hoạt động trong hợp đồng.",
            404,
          );

        case "INVALID_RELATION":
          return apiErrorResponse(
            "Dữ liệu quan hệ không hợp lệ.",
            400,
          );

        case "SERVER_ERROR":
          return apiErrorResponse("Lỗi máy chủ.", 500);
      }
    }

    console.error("PATCH contract_tenants error:", error);
    return apiErrorResponse("Lỗi máy chủ.", 500);
  }
}
