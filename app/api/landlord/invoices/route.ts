// app/api/landlord/invoices/route.ts

import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { invoiceService } from "@/lib/api/services/invoices/invoice.service";
import { apiErrorResponse, apiSuccessResponse } from "@/lib/utils/api-error";


const INVOICE_STATUSES = [
  "UNPAID",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
] as const;

export async function GET(request: NextRequest) {
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

    // 3. Lấy query parameters
    const searchParams = request.nextUrl.searchParams;

    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);

    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    const month =
      monthParam !== null ? Number(monthParam) : undefined;

    const year =
      yearParam !== null ? Number(yearParam) : undefined;

    const keyword = searchParams.get("keyword") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    // 4. Kiểm tra page và limit
    if (!Number.isInteger(page) || page < 1) {
      return apiErrorResponse("Page không hợp lệ", 400);
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return apiErrorResponse("Limit không hợp lệ", 400);
    }

    // 5. Kiểm tra tháng
    if (
      month !== undefined &&
      (!Number.isInteger(month) || month < 1 || month > 12)
    ) {
      return apiErrorResponse("Tháng không hợp lệ", 400);
    }

    // 6. Kiểm tra năm
    if (
      year !== undefined &&
      (!Number.isInteger(year) || year < 2000)
    ) {
      return apiErrorResponse("Năm không hợp lệ", 400);
    }

    // 7. Kiểm tra trạng thái
    if (
      status &&
      !INVOICE_STATUSES.includes(
        status as (typeof INVOICE_STATUSES)[number]
      )
    ) {
      return apiErrorResponse("Trạng thái hóa đơn không hợp lệ", 400);
    }

    // 8. Gọi Service
    const result = await invoiceService.getInvoices({
      page,
      limit,
      month,
      year,
      keyword,
      status,
    });

    // 9. Trả kết quả
    return apiSuccessResponse( "Lấy hóa danh sách đơn thành công" ,result, 200);
  } catch (error) {
    console.error("GET /api/landlord/invoices error:", error);

    return apiErrorResponse(
      "Đã xảy ra lỗi khi lấy danh sách hóa đơn",
      500
    );
  }
}