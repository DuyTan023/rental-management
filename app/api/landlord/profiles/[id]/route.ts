import { profileService } from "@/lib/api/services/profiles/profile.service";
import type { routeContext } from "@/lib/types/api.type";
import {
  apiErrorResponse,
  apiSuccessResponse,
  serverErrorResponse,
} from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const profileId = parseId(id);

    if (profileId === null) {
      return invalidIdResponse();
    }
    const profile = await profileService.getById(profileId);

    return apiSuccessResponse("Lấy người thuê thành công", profile, 200);
  } catch (err) {
    if (err instanceof Error && err.message === "PROFILE_NOT_FOUND") {
      return apiErrorResponse("Khôn tìm thấy người thuê", 404);
    }
    console.error("GET PROFILE ERROR:", err);
    return serverErrorResponse();
  }
}
export async function PUT(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const profileId = parseId(id);

    if (profileId === null) {
      return invalidIdResponse();
    }

    const body = await req.json();
    const profile = await profileService.updateProfile(profileId, body);

    return apiSuccessResponse("Cập nhật người thuê thành công", profile, 201);
  } catch (err) {
    if (err instanceof Error && err.message === "PROFILE_NOT_FOUND") {
      return apiErrorResponse("Không tìm thấy người thuê", 404);
    }

    return serverErrorResponse();
  }
}

export async function DELETE(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const profileId = parseId(id);

    if (profileId === null) {
      return invalidIdResponse();
    }
    await profileService.deleteProfile(profileId);

    return apiSuccessResponse("Xóa người thuê thành công", null, 200);
  } catch (err) {
    if (err instanceof Error && err.message === "PROFILE_NOT_FOUND") {
      return apiErrorResponse("Không tìm thấy người thuê", 404);
    } else if (err instanceof Error && err.message === "PROFILE_IN_USE") {
      return apiErrorResponse("Không thể xóa vì đang sử dụng ", 409);
    }
    return serverErrorResponse();
  }
}
