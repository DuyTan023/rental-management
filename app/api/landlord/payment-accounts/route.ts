
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

    if (session.user.role !== "LANDLORD") {
      return NextResponse.json(
        { message: "Bạn không có quyền truy cập." },
        { status: 403 }
      );
    }

    const data = await paymentAccountService.getAll();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET payment accounts:", error);

    return NextResponse.json(
      { success: false, message: "Không thể tải tài khoản thanh toán." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Vui lòng đăng nhập." },
        { status: 401 }
      );
    }

    if (session.user.role !== "LANDLORD") {
      return NextResponse.json(
        { message: "Bạn không có quyền thực hiện thao tác này." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const account = await paymentAccountService.create(body);

    return NextResponse.json(
      {
        success: true,
        message: "Thêm tài khoản thanh toán thành công.",
        data: account,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST payment accounts:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể thêm tài khoản thanh toán.",
      },
      { status: 400 }
    );
  }
}
