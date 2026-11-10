
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

    const searchParams = request.nextUrl.searchParams;

    const page = getPositiveInteger(
      searchParams.get("page"),
      1
    );

    const limit = getPositiveInteger(
      searchParams.get("limit"),
      10
    );

    const result = await assetIncidentService.getTenantIncidents(
      session.user,
      page,
      limit
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

    console.error("GET tenant incidents error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiErrorResponse("Vui lòng đăng nhập", 401);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return apiErrorResponse("Dữ liệu JSON không hợp lệ", 400);
    }

    const result = await assetIncidentService.createTenantIncident(
      session.user,
      body
    );

    return apiSuccessResponse(
      "Gửi báo cáo sự cố thành công",
      result,
      201
    );
  } catch (error) {
    if (error instanceof AssetIncidentError) {
      return apiErrorResponse(error.message, error.status);
    }

    console.error("POST tenant incident error:", error);
    return serverErrorResponse();
  }
}
