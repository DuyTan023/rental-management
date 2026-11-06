import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { paymentService } from "@/lib/api/services/payments/payment.service";
import { serializeBigInt } from "@/lib/utils/serialize";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
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

    const payment = await paymentService.rejectBankTransfer(
      id,
      body.rejection_reason,
    );

    return NextResponse.json({
      message: "Đã từ chối giao dịch.",
      data: serializeBigInt(payment),
    });
  } catch (error) {
    console.error("PATCH reject payment error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Không thể từ chối giao dịch.",
      },
      { status: 400 },
    );
  }
}