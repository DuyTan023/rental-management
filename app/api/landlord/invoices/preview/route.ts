// app/api/landlord/invoices/preview/route.ts

import { invoiceService } from "@/lib/api/services/invoices/invoice.service";
import { apiErrorResponse, apiSuccessResponse } from "@/lib/utils/api-error";
import { parseId } from "@/lib/utils/function";

import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // // 1. Kiểm tra đăng nhập
    // const session = await auth();

    // if (!session?.user) {
    //   return apiErrorResponse("UNAUTHORIZED", 401);
    // }

    // // 2. Kiểm tra quyền LANDLORD
    // if (session.user.role !== "LANDLORD") {
    //   return apiErrorResponse("FORBIDDEN", 403);
    // }

    // 3. Lấy dữ liệu request
    const body = await request.json();

    const { contract_id, billing_month, billing_year } = body;

    // 4. Kiểm tra dữ liệu đầu vào
    if (!contract_id || !billing_month || !billing_year) {
      return apiErrorResponse("Vui lòng nhập đầy đủ thông tin", 400);
    }

    const contractId = parseId(contract_id);

    if (!contractId) {
      return apiErrorResponse("ID hợp đồng không hợp lệ", 400);
    }

    if (
      !Number.isInteger(billing_month) ||
      billing_month < 1 ||
      billing_month > 12
    ) {
      return apiErrorResponse("Tháng hóa đơn không hợp lệ", 400);
    }

    if (!Number.isInteger(billing_year) || billing_year < 2000) {
      return apiErrorResponse("Năm hóa đơn không hợp lệ", 400);
    }

    // 5. Gọi Service
    const result = await invoiceService.previewInvoice(
      contractId,
      billing_month,
      billing_year,
    );

    // 6. Trả kết quả
    return apiSuccessResponse("Tạo bản ghi hóa đơn thành công", result, 200);
  } catch (error) {
    console.error("POST /api/landlord/invoices/preview error:", error);

    if (error instanceof Error) {
      const message = error.message;

      if (message === "Không tìm thấy hợp đồng") {
        return apiErrorResponse(message, 404);
      }

      if (message.includes("đã tồn tại")) {
        return apiErrorResponse(message, 409);
      }

      return apiErrorResponse(message, 400);
    }

    return apiErrorResponse("Đã xảy ra lỗi khi xem trước hóa đơn", 500);
  }
}
