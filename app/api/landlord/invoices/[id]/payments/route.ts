import { NextRequest } from "next/server";
import { auth } from "@/auth";

import { paymentHistoryService } from "@/lib/api/services/invoices/payment-history.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // 1. Kiểm tra đăng nhập
    const session = await auth();

    if (!session?.user) {
      return Response.json(
        {
          success: false,
          message: "Bạn cần đăng nhập để thực hiện thao tác này.",
        },
        { status: 401 }
      );
    }

    // 2. Kiểm tra quyền
    if (session.user.role !== "LANDLORD") {
      return Response.json(
        {
          success: false,
          message: "Bạn không có quyền xem lịch sử thanh toán.",
        },
        { status: 403 }
      );
    }

    // 3. Kiểm tra ID hóa đơn
    const { id } = await params;

    if (!/^[1-9]\d*$/.test(id)) {
      return Response.json(
        {
          success: false,
          message: "ID hóa đơn không hợp lệ.",
        },
        { status: 400 }
      );
    }

    // 4. Lấy query params
    const searchParams = request.nextUrl.searchParams;

    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);

    const status = searchParams.get("status") || undefined;
    const paymentMethod =
      searchParams.get("payment_method") || undefined;

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return Response.json(
        {
          success: false,
          message: "Tham số phân trang không hợp lệ.",
        },
        { status: 400 }
      );
    }

    // 5. Gọi service
    const result = await paymentHistoryService.getHistory({
      invoiceId: BigInt(id),
      page,
      limit,
      status,
      paymentMethod,
    });

    return Response.json({
      success: true,
      message: "Lấy lịch sử thanh toán thành công.",
      data: result,
    });
  } catch (error) {
    console.error("[GET_INVOICE_PAYMENTS_ERROR]", error);

    if (error instanceof Error) {
      const errors: Record<
        string,
        { message: string; status: number }
      > = {
        INVOICE_NOT_FOUND: {
          message: "Không tìm thấy hóa đơn.",
          status: 404,
        },
        INVALID_PAYMENT_STATUS: {
          message: "Trạng thái thanh toán không hợp lệ.",
          status: 400,
        },
        INVALID_PAYMENT_METHOD: {
          message: "Phương thức thanh toán không hợp lệ.",
          status: 400,
        },
      };

      const knownError = errors[error.message];

      if (knownError) {
        return Response.json(
          {
            success: false,
            message: knownError.message,
          },
          { status: knownError.status }
        );
      }
    }

    return Response.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi lấy lịch sử thanh toán.",
      },
      { status: 500 }
    );
  }
}