import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { tenantInvoiceService } from "@/lib/api/services/tenant/invoice.service";

export async function GET(request: NextRequest) {
  try {
    // =========================================
    // AUTHENTICATION
    // =========================================

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
          message: "Bạn không có quyền truy cập chức năng này.",
        },
        { status: 403 }
      );
    }

    let userId: bigint;

    try {
      userId = BigInt(session.user.id);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Thông tin tài khoản không hợp lệ.",
        },
        { status: 400 }
      );
    }

    // =========================================
    // QUERY PARAMS
    // =========================================

    const searchParams = request.nextUrl.searchParams;

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const monthParam = searchParams.get("billing_month");
    const yearParam = searchParams.get("billing_year");
    const statusParam = searchParams.get("status");

    const result = await tenantInvoiceService.getMany({
      userId,

      page: pageParam === null ? undefined : Number(pageParam),
      limit: limitParam === null ? undefined : Number(limitParam),

      billingMonth:
        monthParam === null ? undefined : Number(monthParam),

      billingYear:
        yearParam === null ? undefined : Number(yearParam),

      status: statusParam || undefined,
    });

    // =========================================
    // RESPONSE
    // =========================================

    // Chuyển BigInt thành string để JSON serialize được.
    // Decimal của Prisma tự serialize thành string.
    const serializedData = JSON.parse(
      JSON.stringify(result, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    return NextResponse.json({
      success: true,
      message: "Lấy danh sách hóa đơn thành công.",
      data: serializedData,
    });
  } catch (error) {
    console.error("[GET_TENANT_INVOICES]", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "INTERNAL_SERVER_ERROR";

    const errorMap: Record<
      string,
      { status: number; message: string }
    > = {
      INVALID_PAGE: {
        status: 400,
        message: "Số trang không hợp lệ.",
      },

      INVALID_LIMIT: {
        status: 400,
        message: "Số lượng mỗi trang phải từ 1 đến 50.",
      },

      INVALID_BILLING_MONTH: {
        status: 400,
        message: "Tháng hóa đơn phải nằm trong khoảng từ 1 đến 12.",
      },

      INVALID_BILLING_YEAR: {
        status: 400,
        message: "Năm hóa đơn không hợp lệ.",
      },

      INVALID_INVOICE_STATUS: {
        status: 400,
        message: "Trạng thái hóa đơn không hợp lệ.",
      },

      PROFILE_NOT_FOUND: {
        status: 404,
        message: "Không tìm thấy hồ sơ người thuê.",
      },
    };

    const mappedError = errorMap[errorMessage];

    return NextResponse.json(
      {
        success: false,
        message:
          mappedError?.message ??
          "Đã xảy ra lỗi khi lấy danh sách hóa đơn.",
      },
      {
        status: mappedError?.status ?? 500,
      }
    );
  }
}