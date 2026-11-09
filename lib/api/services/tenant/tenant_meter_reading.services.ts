
import { meter_type } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { tenantMeterReadingRepository } from "@/lib/api/repositories/tenant/tenant_meter_reading.repository";

const meterTypes: meter_type[] = [
  "ELECTRICITY",
  "WATER",
];

export const tenantMeterReadingService = {
  // =====================================
  // GET: Dữ liệu trang báo cáo chỉ số của người thuê
  // =====================================

  getMyMeterReadings: async (userId: bigint) => {
    try {
      // 1. Kiểm tra tài khoản
      const user = await prisma.users.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          role: true,
          status: true,
        },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      if (user.status !== "ACTIVE") {
        throw new Error("USER_INACTIVE");
      }

      if (user.role !== "TENANT") {
        throw new Error("FORBIDDEN");
      }

      // 2. Lấy profile
      const profile =
        await tenantMeterReadingRepository.findProfileByUserId(
          userId
        );

      if (!profile) {
        throw new Error("PROFILE_NOT_FOUND");
      }

      // 3. Lấy hợp đồng ACTIVE của người thuê
      const contractTenant =
        await tenantMeterReadingRepository.findActiveContractTenant(
          profile.id
        );

      if (!contractTenant) {
        throw new Error("ACTIVE_CONTRACT_NOT_FOUND");
      }

      const contract = contractTenant.rental_contracts;
      const room = contract.rooms;

      // 4. Lấy chỉ số APPROVED gần nhất của điện và nước
      const currentReadings = await Promise.all(
        meterTypes.map(async (meterType) => {
          const reading =
            await tenantMeterReadingRepository.findLatestApprovedReading(
              room.id,
              contract.id,
              meterType
            );

          return {
            meterType,

            currentValue: reading
              ? Number(reading.new_value)
              : null,

            readingDate: reading
              ? reading.reading_date
              : null,

            source: reading
              ? reading.period_month === null &&
                reading.period_year === null
                ? "INITIAL_HANDOVER"
                : "MONTHLY_REPORT"
              : null,
            

            // Dùng serviceId khi tạo báo cáo tiếp theo
            serviceId: reading
              ? reading.service_id.toString()
              : null,
          };
        })
      );

      // 5. Lấy lịch sử báo cáo của người thuê
      const history =
        await tenantMeterReadingRepository.findTenantReadings(
          contract.id,
          // userId
        );

      // 6. Format dữ liệu trả về
      const formattedHistory = history.map((reading) => ({
        id: reading.id.toString(),

        meterType: reading.meter_type,

        oldValue: Number(reading.old_value),

        newValue: Number(reading.new_value),

        consumption:
          reading.consumption !== null
            ? Number(reading.consumption)
            : 0,

        readingDate: reading.reading_date,

        status: reading.status ?? "PENDING",

        imageUrl: reading.image_url,

        note: reading.note,

        periodMonth: reading.period_month,

        periodYear: reading.period_year,
      }));

      // 7. Trả kết quả
      return {
        room: {
          id: room.id.toString(),
          roomNumber: room.room_number,
        },

        contract: {
          id: contract.id.toString(),
          contractNumber: contract.contract_number,
          startDate: contract.start_date,
          endDate: contract.end_date,
        },

        currentReadings,

        history: formattedHistory,
      };
    } catch (error) {
      console.error(
        "Error get tenant meter readings:",
        error
      );

      const allowedErrors = [
        "USER_NOT_FOUND",
        "USER_INACTIVE",
        "FORBIDDEN",
        "PROFILE_NOT_FOUND",
        "ACTIVE_CONTRACT_NOT_FOUND",
      ];

      if (
        error instanceof Error &&
        allowedErrors.includes(error.message)
      ) {
        throw error;
      }

      throw new Error("SERVER_ERROR");
    }
  },
};
