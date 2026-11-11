
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { paymentAccountService } from "@/lib/api/services/payment-accounts/payment-account.service";

type Context = {
  params: Promise<{ id: string }>;
};

async function checkLandlord(): Promise<NextResponse | null> {
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

  return null;
}

export async function PATCH(
  request: Request,
  { params }: Context
): Promise<NextResponse> {
  try {
    const permission = await checkLandlord();

    if (permission) return permission;

    const { id } = await params;
    const body = await request.json();

    const account = await paymentAccountService.update(id, body);

    return NextResponse.json({
      success: true,
      message: "Cập nhật tài khoản thành công.",
      data: account,
    });
  } catch (error) {
    console.error("PATCH payment account:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật tài khoản.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: Context
): Promise<NextResponse> {
  try {
    const permission = await checkLandlord();

    if (permission) return permission;

    const { id } = await params;
    const account = await paymentAccountService.deactivate(id);

    return NextResponse.json({
      success: true,
      message: "Đã ngừng sử dụng tài khoản.",
      data: account,
    });
  } catch (error) {
    console.error("DELETE payment account:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể ngừng sử dụng tài khoản.",
      },
      { status: 400 }
    );
  }
}
