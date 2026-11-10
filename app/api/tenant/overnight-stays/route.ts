
import { NextRequest } from "next/server";
import { auth } from "@/auth";

import { overnightStayService } from "@/lib/api/services/overnight-stay/overnight-stay.service";

import {
  apiErrorResponse,
  apiSuccessResponse,
  errorResponse,
} from "@/lib/utils/api-error";

const ALLOWED_STATUSES = [
  "PENDING",
  "COMPLETED",
  "CANCELLED",
] as const;

type NotificationStatus =
  (typeof ALLOWED_STATUSES)[number];

// ==========================================
// POST - Tạo thông báo khách ở qua đêm
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiErrorResponse(
        "Vui lòng đăng nhập",
        401
      );
    }

    if (session.user.role !== "TENANT") {
      return apiErrorResponse(
        "Không có quyền truy cập",
        403
      );
    }

    const body = await request.json();

    const data = await overnightStayService.create(
      BigInt(session.user.id),
      body
    );

    return apiSuccessResponse(
      "Tạo thông báo lưu trú thành công",
      data,
      201
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// ==========================================
// GET - Danh sách thông báo của người thuê
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiErrorResponse(
        "Vui lòng đăng nhập",
        401
      );
    }

    if (session.user.role !== "TENANT") {
      return apiErrorResponse(
        "Không có quyền truy cập",
        403
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // --------------------------------------
    // Pagination
    // --------------------------------------

    const rawPage = searchParams.get("page") ?? "1";
    const rawLimit = searchParams.get("limit") ?? "10";

    const page = Number(rawPage);
    const limit = Number(rawLimit);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return apiErrorResponse(
        "Thông tin phân trang không hợp lệ",
        400
      );
    }

    // --------------------------------------
    // Status filter
    // --------------------------------------

    const rawStatus = searchParams.get("status");

    let status: NotificationStatus | undefined;

    if (rawStatus && rawStatus !== "ALL") {
      if (
        !ALLOWED_STATUSES.includes(
          rawStatus as NotificationStatus
        )
      ) {
        return apiErrorResponse(
          "Trạng thái thông báo không hợp lệ",
          400
        );
      }

      status = rawStatus as NotificationStatus;
    }

    // --------------------------------------
    // Service
    // --------------------------------------

    const result = await overnightStayService.getMyList(
      BigInt(session.user.id),
      page,
      limit,
      status
    );

    return apiSuccessResponse(
      "Lấy danh sách thông báo lưu trú thành công",
      result,
      200
    );
  } catch (error) {
    return errorResponse(error);
  }
}
