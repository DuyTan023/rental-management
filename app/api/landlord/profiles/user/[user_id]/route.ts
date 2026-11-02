//api/landloard/profiles/user/[user_id]/route.ts
import type { Prisma } from "@/generated/prisma/client";
import { profileService } from "@/lib/api/services/profiles/profile.service";
import {
  apiErrorResponse,
  apiSuccessResponse,
  serverErrorResponse,
} from "@/lib/utils/api-error";
import { parseId } from "@/lib/utils/function";
import { NextRequest } from "next/server";
export type userIdrouteContext = { params: Promise<{ user_id: string }> };
export async function GET(req: NextRequest, { params }: userIdrouteContext) {
  try {
    // Lấy user_id
    const { user_id } = await params;

    const userId = parseId(user_id);
    if (userId === null) {
      return apiErrorResponse("Vui lòng truyền userID hợp lệ", 409);
    }
    const profile = await profileService.getByUserId(userId);
    return apiSuccessResponse(
      "Lấy thành công profile theo user_id",
      profile,
      200,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "PROFILE_NOT_FOUND") {
      return apiErrorResponse("Không tìm thấy profile", 404);
    }
    return serverErrorResponse();
  }
}

export async function PATCH(req: NextRequest, { params }: userIdrouteContext) {
  try {
    // Lấy user_id
    const { user_id } = await params;

    const userId = parseId(user_id);
    if (userId === null) {
      return apiErrorResponse("Vui lòng truyền userID hợp lệ", 409);
    }

    const body: Prisma.usersUpdateInput = await req.json();
    const user = await profileService.updateUser(userId, body);
    return apiSuccessResponse("Cập nhật user thành công!", user, 200);
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return apiErrorResponse("Không tìm thấy profile", 404);
    }
    if (error instanceof Error && error.message === "USER_EXISTS") {
      return apiErrorResponse("Dứ liệu trùng", 409);
    }
    return serverErrorResponse();
  }
}
