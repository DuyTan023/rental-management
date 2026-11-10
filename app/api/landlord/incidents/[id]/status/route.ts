
import { auth } from "@/auth";
import {
  assetIncidentService,
  AssetIncidentError,
} from "@/lib/api/services/asset-incidents/asset-incident.service";
import {
  apiErrorResponse,
  apiSuccessResponse,
  serverErrorResponse,
} from "@/lib/utils/api-error";
import { parseId } from "@/lib/utils/function";
import { NextRequest } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiErrorResponse("Vui lòng đăng nhập", 401);
    }

    const { id } = await params;
    const incidentId = parseId(id);

    if (incidentId === null || incidentId <= 0) {
      return apiErrorResponse("ID báo cáo không hợp lệ", 400);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return apiErrorResponse("Dữ liệu JSON không hợp lệ", 400);
    }

    const result = await assetIncidentService.updateStatus(
      session.user,
      incidentId,
      body
    );

    return apiSuccessResponse(
      "Cập nhật trạng thái báo cáo thành công",
      result,
      200
    );
  } catch (error) {
    if (error instanceof AssetIncidentError) {
      return apiErrorResponse(error.message, error.status);
    }

    console.error("PATCH incident status error:", error);
    return serverErrorResponse();
  }
}
