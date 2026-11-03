
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getVietnamToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    // Cột effective_date là kiểu PostgreSQL DATE,
    // nên dùng ngày lịch Việt Nam, không dùng giờ hiện tại.
    const today = new Date(`${getVietnamToday()}T00:00:00.000Z`);

    const result = await prisma.$transaction(async (tx) => {
      const contracts = await tx.rental_contracts.findMany({
        where: {
          status: "ACTIVE",
        },
        include: {
          contract_price_adjustments: {
            where: {
              effective_date: {
                lte: today,
              },
            },
            orderBy: [
              { effective_date: "desc" },
              { created_at: "desc" },
              { id: "desc" },
            ],
            take: 1,
          },
        },
      });

      let updated = 0;
      let unchanged = 0;

      for (const contract of contracts) {
        const adjustment = contract.contract_price_adjustments[0];

        const rentPrice =
          adjustment?.new_rent_price ?? contract.rent_price;

        const room = await tx.rooms.findUnique({
          where: {
            id: contract.room_id,
          },
          select: {
            listed_rent: true,
          },
        });

        if (!room) {
          continue;
        }

        // Không ghi DB nếu giá đã đúng.
        if (room.listed_rent.equals(rentPrice)) {
          unchanged++;
          continue;
        }

        await tx.rooms.update({
          where: {
            id: contract.room_id,
          },
          data: {
            listed_rent: rentPrice,
          },
        });

        updated++;
      }

      return {
        contractsChecked: contracts.length,
        roomsUpdated: updated,
        roomsUnchanged: unchanged,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Đã xử lý cập nhật giá niêm yết.",
      date: getVietnamToday(),
      ...result,
    });
  } catch (error) {
    console.error("Cron update room rent failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Không thể cập nhật giá niêm yết.",
      },
      { status: 500 },
    );
  }
}
