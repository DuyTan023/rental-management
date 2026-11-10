
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
import { NextRequest } from "next/server";

function getPositiveInteger(
  value: string | null,
  defaultValue: number
): number {
  if (value === null) return defaultValue;

  if (!/^[1-9]\d*$/.test(value)) {
    return NaN;
  }

  const number = Number(value);

  return Number.isSafeInteger(number) ? number : NaN;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiErrorResponse("Vui lòng đăng nhập", 401);
    }

    const params = request.nextUrl.searchParams;

    const filters = {
      status: params.get("status") || undefined,
      priority: params.get("priority") || undefined,
      room_id: params.get("room_id") || undefined,
      page: getPositiveInteger(params.get("page"), 1),
      limit: getPositiveInteger(params.get("limit"), 10),
    };

    const result = await assetIncidentService.getLandlordIncidents(
      session.user,
      filters
    );

    return apiSuccessResponse(
      "Lấy danh sách báo cáo sự cố thành công",
      result,
      200
    );
  } catch (error) {
    if (error instanceof AssetIncidentError) {
      return apiErrorResponse(error.message, error.status);
    }

    console.error("GET landlord incidents error:", error);
    return serverErrorResponse();
  }
}
