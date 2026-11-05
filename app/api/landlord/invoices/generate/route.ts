// app/api/landlord/invoices/generate/route.ts

import { invoiceService } from "@/lib/api/services/invoices/invoice.service";
import { apiErrorResponse, apiSuccessResponse } from "@/lib/utils/api-error";
import { parseId } from "@/lib/utils/function";

import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // 1. Kiểm tra đăng nhập
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

    const { contract_ids, billing_month, billing_year, due_date } = body;

    // 4. Kiểm tra dữ liệu đầu vào
    if (!Array.isArray(contract_ids) || contract_ids.length === 0) {
      return apiErrorResponse("Vui lòng chọn ít nhất một hợp đồng", 400);
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

    // Kiểm tra hạn thanh toán
    if (typeof due_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
      return apiErrorResponse("Hạn thanh toán không hợp lệ", 400);
    }

    const dueDate = new Date(`${due_date}T00:00:00.000Z`);

    if (
      Number.isNaN(dueDate.getTime()) ||
      dueDate.toISOString().slice(0, 10) !== due_date
    ) {
      return apiErrorResponse("Hạn thanh toán không hợp lệ", 400);
    }

    // Chuyển contract_ids thành BigInt
    const contractIds = contract_ids.map((id: string) => {
      if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
        throw new Error("ID hợp đồng không hợp lệ");
      }

      return parseId(id);
    });

    if (contractIds.some((id: bigint | null) => id === null)) {
      return apiErrorResponse("ID hợp đồng không hợp lệ", 400);
    }

    // Kiểm tra ID trùng nhau
    if (new Set(contract_ids).size !== contract_ids.length) {
      return apiErrorResponse(
        "Danh sách hợp đồng không được chứa ID trùng nhau",
        400,
      );
    }

    // 5. Gọi Service
    const result = await invoiceService.generateInvoices(
      contractIds as bigint[],
      billing_month,
      billing_year,
      dueDate,
    );

    // 6. Trả kết quả
    return apiSuccessResponse("Tạo bản ghi hóa đơn thành công", result, 200);
  } catch (error) {
    console.error("POST /api/landlord/invoices/generate error:", error);

    if (error instanceof Error) {
      return apiErrorResponse(error.message, 400);
    }

    return apiErrorResponse("Đã xảy ra lỗi khi lập hóa đơn", 500);
  }
}
