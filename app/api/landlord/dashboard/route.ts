
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dashboardService } from "@/lib/api/services/dashboard/dashboard.service";

export async function GET() {
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
        { message: "Bạn không có quyền truy cập." },
        { status: 403 },
      );
    }

    const data = await dashboardService.getDashboard();

    return NextResponse.json({
      message: "Lấy dữ liệu Dashboard thành công.",
      data,
    });
  } catch (error) {
    console.error("GET landlord dashboard error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Không thể lấy dữ liệu Dashboard.",
      },
      { status: 500 },
    );
  }
}
