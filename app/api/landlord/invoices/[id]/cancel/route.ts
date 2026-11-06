import { NextRequest } from "next/server";
import { auth } from "@/auth";

import { invoiceCancelService } from "@/lib/api/services/invoices/invoice-cancel.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

export async function PATCH(
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
          message: "Bạn không có quyền hủy hóa đơn.",
        },
        { status: 403 }
      );
    }

    // 3. Kiểm tra ID
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

    // 4. Kiểm tra ID người thực hiện
    const userId = session.user.id;

    if (
      !userId ||
      !/^[1-9]\d*$/.test(String(userId))
    ) {
      return Response.json(
        {
          success: false,
          message: "Không xác định được tài khoản thực hiện.",
        },
        { status: 401 }
      );
    }

    // 5. Lấy lý do hủy
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          message: "Dữ liệu gửi lên không hợp lệ.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("reason" in body) ||
      typeof body.reason !== "string"
    ) {
      return Response.json(
        {
          success: false,
          message: "Vui lòng cung cấp lý do hủy hóa đơn.",
        },
        { status: 400 }
      );
    }

    // 6. Gọi service
    const result = await invoiceCancelService.cancel({
      invoiceId: BigInt(id),
      reason: body.reason,
    });

    return Response.json({
      success: true,
      message: "Hủy hóa đơn thành công.",
      data: result,
    });
  } catch (error) {
    console.error("[CANCEL_INVOICE_ERROR]", error);

    if (error instanceof Error) {
      const errors: Record<
        string,
        { message: string; status: number }
      > = {
        INVOICE_NOT_FOUND: {
          message: "Không tìm thấy hóa đơn.",
          status: 404,
        },

        INVOICE_ALREADY_CANCELLED: {
          message: "Hóa đơn này đã được hủy trước đó.",
          status: 409,
        },

        INVOICE_HAS_PAYMENT: {
          message:
            "Không thể hủy hóa đơn đã có khoản thanh toán thành công.",
          status: 409,
        },

        CANCELLATION_REASON_REQUIRED: {
          message: "Vui lòng nhập lý do hủy hóa đơn.",
          status: 400,
        },

        CANCELLATION_REASON_TOO_LONG: {
          message: "Lý do hủy không được vượt quá 1000 ký tự.",
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

      // Prisma transaction conflict
      if (
        "code" in error &&
        error.code === "P2034"
      ) {
        return Response.json(
          {
            success: false,
            message:
              "Dữ liệu hóa đơn vừa thay đổi. Vui lòng tải lại và thử lại.",
          },
          { status: 409 }
        );
      }
    }

    return Response.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi hủy hóa đơn.",
      },
      { status: 500 }
    );
  }
}