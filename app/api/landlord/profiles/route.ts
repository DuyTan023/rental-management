import type { profiles } from "@/generated/prisma/client";
import { profileService } from "@/lib/api/services/profiles/profile.service";
import type { ApiResponse, PaginationResult } from "@/lib/types/api.type";
import { serverErrorResponse } from "@/lib/utils/api-error";
import { serializeBigInt } from "@/lib/utils/serialize";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = Number(searchParams.get("page"));
    const limitParam = Number(searchParams.get("limit"));
    const keyword = searchParams.get("keyword") || undefined;

    // Tránh lỗi nhập ký tự thì cho về 1 hết
    const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
    // Giới hạn giá trị 100 mẫu tin tránh limit=1000000
    const limit =
      Number.isInteger(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 10;

    const profiles = await profileService.getProfile({ page, limit, keyword });
    return NextResponse.json<ApiResponse<PaginationResult<profiles>>>(
      {
        success: true,
        message: "Lấy danh sách người thuê thành công",
        data: serializeBigInt(profiles),
      },
      { status: 200 },
    );
  } catch (err) {
    return serverErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = await profileService.createProfile(body.profile, body.user);
    return NextResponse.json<ApiResponse<typeof profile>>(
      {
        success: true,
        message: "Tạo mới người thuê thành công",
        data: serializeBigInt(profile),
      },
      {
        status: 201,
      },
    );
  } catch (err) {
    if (err instanceof Error && err.message === "PROFILE_EXISTS") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Người thuê đã tồn tại!",
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
