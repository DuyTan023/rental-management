// import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/auth";
// import { paymentService } from "@/lib/api/services/payments/payment.service";

// type RouteContext = {
//   params: Promise<{
//     id: string;
//   }>;
// };

// function jsonResponse(data: unknown, status = 200) {
//   return new NextResponse(
//     JSON.stringify(data, (_key, value) =>
//       typeof value === "bigint" ? value.toString() : value,
//     ),
//     {
//       status,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     },
//   );
// }

// export async function POST(
//   request: NextRequest,
//   { params }: RouteContext,
// ) {
//   try {
//     // 1. Kiểm tra đăng nhập
//     const session = await auth();

//     if (!session?.user) {
//       return jsonResponse(
//         { success: false, message: "Bạn cần đăng nhập" },
//         401,
//       );
//     }

//     // 2. Kiểm tra quyền chủ trọ
//     if (session.user.role !== "LANDLORD") {
//       return jsonResponse(
//         { success: false, message: "Bạn không có quyền thực hiện thao tác này" },
//         403,
//       );
//     }

//     // 3. Kiểm tra user ID
//     const userId = session.user.id;

//     if (!userId || !/^\d+$/.test(userId)) {
//       return jsonResponse(
//         { success: false, message: "Thông tin tài khoản không hợp lệ" },
//         401,
//       );
//     }

//     // 4. Lấy và kiểm tra invoice ID
//     const { id } = await params;

//     if (!/^[1-9]\d*$/.test(id)) {
//       return jsonResponse(
//         { success: false, message: "ID hóa đơn không hợp lệ" },
//         400,
//       );
//     }

//     // 5. Đọc request body
//     let body: unknown;

//     try {
//       body = await request.json();
//     } catch {
//       return jsonResponse(
//         { success: false, message: "Dữ liệu JSON không hợp lệ" },
//         400,
//       );
//     }

//     if (
//       typeof body !== "object" ||
//       body === null ||
//       Array.isArray(body)
//     ) {
//       return jsonResponse(
//         { success: false, message: "Dữ liệu yêu cầu không hợp lệ" },
//         400,
//       );
//     }

//     const { amount, note } = body as {
//       amount?: unknown;
//       note?: unknown;
//     };

//     // 6. Validate dữ liệu cơ bản
//     if (typeof amount !== "string") {
//       return jsonResponse(
//         { success: false, message: "Số tiền phải được gửi dưới dạng chuỗi" },
//         400,
//       );
//     }

//     if (note !== undefined && note !== null && typeof note !== "string") {
//       return jsonResponse(
//         { success: false, message: "Ghi chú không hợp lệ" },
//         400,
//       );
//     }

//     // 7. Gọi Service
//     const result = await paymentService.createCashPayment({
//       invoiceId: BigInt(id),
//       amount,
//       landlordId: BigInt(userId),
//       note: note ?? undefined,
//     });

//     return jsonResponse(
//       {
//         success: true,
//         message: "Ghi nhận thanh toán tiền mặt thành công",
//         data: result,
//       },
//       201,
//     );
//   } catch (error) {
//     console.error("POST /api/landlord/invoices/[id]/payments/cash:", error);

//     if (error instanceof Error) {
//       const message = error.message;

//       const notFoundMessages = [
//         "Không tìm thấy hóa đơn",
//       ];

//       if (notFoundMessages.includes(message)) {
//         return jsonResponse(
//           { success: false, message },
//           404,
//         );
//       }

//       const clientErrorMessages = [
//         "Số tiền không hợp lệ",
//         "Số tiền phải lớn hơn 0",
//         "Hóa đơn đã bị hủy",
//         "Hóa đơn đã được thanh toán đủ",
//         "Số tiền nhận vượt quá số tiền còn có thể thanh toán",
//       ];

//       if (clientErrorMessages.includes(message)) {
//         return jsonResponse(
//           { success: false, message },
//           400,
//         );
//       }
//     }

//     return jsonResponse(
//       {
//         success: false,
//         message: "Đã xảy ra lỗi khi ghi nhận thanh toán",
//       },
//       500,
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { paymentService } from "@/lib/api/services/payments/payment.service";
import { serializeBigInt } from "@/lib/utils/serialize";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: Context,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Vui lòng đăng nhập." },
        { status: 401 },
      );
    }

    if (session.user.role !== "LANDLORD") {
      return NextResponse.json(
        { message: "Bạn không có quyền thực hiện thao tác này." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    const payment = await paymentService.createCashPayment({
      invoiceId: id,
      landlordId: session.user.id,
      body,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Ghi nhận thanh toán tiền mặt thành công.",
        data: serializeBigInt(payment),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST cash payment error:", error);

   return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể ghi nhận thanh toán.",
      },
      { status: 400 },
    );
  }
}