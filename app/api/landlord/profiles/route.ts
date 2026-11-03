import type { profiles } from "@/generated/prisma/client";
import { ProfileWithUser } from "@/lib/api/repositories/profiles/profiles.repository";
import { profileService } from "@/lib/api/services/profiles/profile.service";
import type { ApiResponse, PaginationResult } from "@/lib/types/api.type";
import {
  apiErrorResponse,
  apiSuccessResponse,
  serverErrorResponse,
} from "@/lib/utils/api-error";
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
    return NextResponse.json<ApiResponse<PaginationResult<ProfileWithUser>>>(
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

    if (!body?.profile || !body?.user) {
      return apiErrorResponse(
        "Vui lòng cung cấp thông tin tài khoản và hồ sơ người thuê.",
        400,
      );
    }

    // Chuẩn hóa ngày sinh trước khi gửi cho Prisma.
    const rawDate = body.profile.date_of_birth;
    let dateOfBirth: Date | null = null;

    if (rawDate !== null && rawDate !== undefined && rawDate !== "") {
      if (
        typeof rawDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ) {
        return apiErrorResponse("Ngày sinh không hợp lệ.", 400);
      }

      const [year, month, day] = rawDate.split("-").map(Number);
      const parsedDate = new Date(Date.UTC(year, month - 1, day));

      // Kiểm tra ngày thực tế, ví dụ không chấp nhận 2003-02-31.
      if (
        parsedDate.getUTCFullYear() !== year ||
        parsedDate.getUTCMonth() !== month - 1 ||
        parsedDate.getUTCDate() !== day
      ) {
        return apiErrorResponse("Ngày sinh không hợp lệ.", 400);
      }

      dateOfBirth = parsedDate;
    }

    const profileData = {
      ...body.profile,
      date_of_birth: dateOfBirth,
    };

    const result = await profileService.createProfile(
      profileData,
      body.user,
    );

    return apiSuccessResponse(
      "Tạo mới người thuê thành công.",
      serializeBigInt(result),
      201,
    );
  } catch (error) {
    console.error("POST /api/landlord/profiles error:", error);

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      switch (error.message) {
        case "PROFILE_EXISTS":
          return apiErrorResponse(
            "Thông tin hồ sơ đã tồn tại.",
            409,
          );

        case "USER_EXISTS":
          return apiErrorResponse(
            "Email tài khoản đã được sử dụng.",
            409,
          );

        case "INVALID_RELATION":
          return apiErrorResponse(
            "Dữ liệu liên kết không hợp lệ.",
            400,
          );
      }
    }

    return serverErrorResponse();
  }
}