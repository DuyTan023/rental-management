
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { paymentAccountService } from "@/lib/api/services/payment-accounts/payment-account.service";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Vui lòng đăng nhập." },
        { status: 401 }
      );
    }

    if (session.user.role !== "TENANT") {
      return NextResponse.json(
        { message: "Bạn không có quyền truy cập." },
        { status: 403 }
      );
    }

    const data = await paymentAccountService.getActive();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET tenant payment accounts:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Không thể tải thông tin tài khoản thanh toán.",
      },
      { status: 500 }
    );
  }
}
