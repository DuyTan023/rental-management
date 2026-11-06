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

    if (session.user.role !== "TENANT") {
      return NextResponse.json(
        { message: "Bạn không có quyền thực hiện thao tác này." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    const payment = await paymentService.createBankTransferRequest({
      invoiceId: id,
      userId: session.user.id,
      body,
    });

    return NextResponse.json(
      {
        message: "Gửi yêu cầu thanh toán thành công. Vui lòng chờ chủ trọ xác nhận.",
        data: serializeBigInt(payment),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST bank transfer error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Không thể gửi yêu cầu thanh toán.",
      },
      { status: 400 },
    );
  }
}