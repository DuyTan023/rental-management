// app/api/landlord/invoices/[id]/route.ts

import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { invoiceService } from "@/lib/api/services/invoices/invoice.service";
import {
  apiErrorResponse,
  apiSuccessResponse,
} from "@/lib/utils/api-error";
import { parseId } from "@/lib/utils/function";


type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // 1. Kiểm tra đăng nhập
    // const session = await auth();

    // if (!session?.user) {
    //   return apiErrorResponse("UNAUTHORIZED", 401);
    // }

    // // 2. Kiểm tra quyền
    // if (session.user.role !== "LANDLORD") {
    //   return apiErrorResponse("FORBIDDEN", 403);
    // }

    // 3. Lấy ID từ URL
    const { id } = await params;

    const invoiceId = parseId(id);

    if (!invoiceId) {
      return apiErrorResponse("ID hóa đơn không hợp lệ", 400);
    }

    // 4. Gọi Service
    const result = await invoiceService.getInvoiceById(invoiceId);

    // 5. Trả kết quả
    return apiSuccessResponse("Lấy chi tiết hóa đơn thành công", result, 200);
  } catch (error) {
    console.error(
      "GET /api/landlord/invoices/[id] error:",
      error
    );

    if (
      error instanceof Error &&
      error.message === "Không tìm thấy hóa đơn"
    ) {
      return apiErrorResponse(error.message, 404);
    }

    return apiErrorResponse(
      "Đã xảy ra lỗi khi lấy chi tiết hóa đơn",
      500
    );
  }
}