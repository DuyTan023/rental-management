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

    if (session.user.role !== "TENANT") {
      return NextResponse.json(
        { message: "Bạn không có quyền thực hiện thao tác này." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const payment = await paymentService.cancelBankTransferRequest(
      id,
      session.user.id,
    );

    return NextResponse.json({
      message: "Đã hủy yêu cầu thanh toán.",
      data: serializeBigInt(payment),
    });
  } catch (error) {
    console.error("PATCH cancel payment error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Không thể hủy yêu cầu thanh toán.",
      },
      { status: 400 },
    );
  }
}