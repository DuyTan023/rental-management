// app/api/landlord/invoices/[id]/pdf/route.ts

import { NextRequest } from "next/server";
import { auth } from "@/auth";

import { invoicePdfService } from "@/lib/api/services/invoices/invoice-pdf.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    // 1. Kiểm tra đăng nhập
    // const session = await auth();

    // if (!session?.user) {
    //   return Response.json(
    //     {
    //       success: false,
    //       message: "Bạn cần đăng nhập để thực hiện thao tác này.",
    //     },
    //     { status: 401 }
    //   );
    // }

    // // 2. Kiểm tra quyền
    // if (session.user.role !== "LANDLORD") {
    //   return Response.json(
    //     {
    //       success: false,
    //       message: "Bạn không có quyền xuất hóa đơn.",
    //     },
    //     { status: 403 }
    //   );
    // }

    // 3. Lấy và kiểm tra ID
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

    // 4. Xuất PDF
    const result = await invoicePdfService.exportPdf(BigInt(id));

    // 5. Trả file PDF
    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(result.fileName)}`,
        "Content-Length": String(result.buffer.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[GET_INVOICE_PDF_ERROR]", error);

    if (error instanceof Error) {
      if (error.message === "INVOICE_NOT_FOUND") {
        return Response.json(
          {
            success: false,
            message: "Không tìm thấy hóa đơn.",
          },
          { status: 404 }
        );
      }

      if (error.message === "INVOICE_CANCELLED") {
        return Response.json(
          {
            success: false,
            message: "Không thể xuất hóa đơn đã bị hủy.",
          },
          { status: 400 }
        );
      }
    }

    return Response.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi xuất hóa đơn PDF.",
      },
      { status: 500 }
    );
  }
}

// export async function GET() {
//   return Response.json({
//     success: true,
//     message: "PDF API is working",
//   });
// }