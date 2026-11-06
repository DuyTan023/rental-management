import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { paymentService } from "@/lib/api/services/payments/payment.service";
import { serializeBigInt } from "@/lib/utils/serialize";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  _request: Request,
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

    const payment = await paymentService.confirmBankTransfer(id);

    return NextResponse.json({
      message: "Xác nhận thanh toán thành công.",
      data: serializeBigInt(payment),
    });
  } catch (error) {
    console.error("PATCH confirm payment error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Không thể xác nhận giao dịch.",
      },
      { status: 400 },
    );
  }
}