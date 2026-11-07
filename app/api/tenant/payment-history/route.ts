import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { tenantPaymentHistoryService } from "@/lib/api/services/tenant/tenant-payment-history.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Vui lòng đăng nhập.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "TENANT") {
      return NextResponse.json(
        {
          success: false,
          message: "Bạn không có quyền truy cập.",
        },
        { status: 403 }
      );
    }

    const userId = BigInt(session.user.id);

    const data = await tenantPaymentHistoryService.getHistory(
      userId,
      request.nextUrl.searchParams
    );

    return NextResponse.json({
      success: true,
      message: "Lấy lịch sử thanh toán thành công.",
      data,
    });
  } catch (error) {
    console.error("GET /api/tenant/payment-history:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Đã xảy ra lỗi khi lấy lịch sử thanh toán.";

    const status =
      message.includes("không hợp lệ") ||
      message.includes("chưa có hồ sơ")
        ? 400
        : 500;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}