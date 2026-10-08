import type { profiles } from "@/generated/prisma/client";
import { profileService } from "@/lib/api/services/profiles/profile.service";
import type { ApiResponse, routeContext } from "@/lib/types/api.type";
import { serverErrorResponse } from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { serializeBigInt } from "@/lib/utils/serialize";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const profileId = parseId(id);

    if (profileId === null) {
      return invalidIdResponse();
    }
    const profile = await profileService.getById(profileId);

    return NextResponse.json<ApiResponse<profiles>>(
      {
        success: true,
        message: "Lấy người thuê thành công",
        data: serializeBigInt(profile),
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Error && err.message === "PROFILE_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không tìm thấy thông tin người thuê!",
          data: null,
        },
        { status: 404 },
      );
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

    return NextResponse.json<ApiResponse<typeof profile>>(
      {
        success: true,
        message: "Cập nhật thông tin người thuê thành công!",
        data: serializeBigInt(profile),
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Error && err.message === "PROFILE_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không tìm thấy người thuê!",
          data: null,
        },
        { status: 404 },
      );
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

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: "Xóa người thuê thành công!",
      data: null,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "PROFILE_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không tìm thấy người thuê!",
          data: null,
        },
        { status: 404 },
      );
    } else if (err instanceof Error && err.message === "PROFILE_IN_USE") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không thể xóa vì đang sử dụng!",
          data: null,
        },
        { status: 409 },
      );
    }
    return serverErrorResponse();
  }
}
