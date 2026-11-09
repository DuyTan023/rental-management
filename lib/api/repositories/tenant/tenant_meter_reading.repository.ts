
import { meter_type } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const tenantMeterReadingRepository = {
  // 1. Lấy profile theo userId
  findProfileByUserId: async (userId: bigint) => {
    return prisma.profiles.findUnique({
      where: {
        user_id: userId,
      },
    });
  },

  // 2. Kiểm tra người thuê có hợp đồng ACTIVE
  // Đồng thời lấy thông tin phòng
  findActiveContractTenant: async (profileId: bigint) => {
    return prisma.contract_tenants.findFirst({
      where: {
        profile_id: profileId,
        status: "ACTIVE",
        rental_contracts: {
          status: "ACTIVE",
        },
      },
      include: {
        rental_contracts: {
          include: {
            rooms: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  },

  // 3. Lấy chỉ số APPROVED gần nhất theo loại đồng hồ
  findLatestApprovedReading: async (
    roomId: bigint,
    contractId: bigint,
    meterType: meter_type
  ) => {
    return prisma.meter_readings.findFirst({
      where: {
        room_id: roomId,
        contract_id: contractId,
        meter_type: meterType,
        status: "APPROVED",
      },
      orderBy: [
        {
          reading_date: "desc",
        },
        {
          id: "desc",
        },
      ],
    });
  },

  // 4. Lấy lịch sử báo cáo do người thuê hiện tại gửi
  // Bao gồm PENDING, APPROVED, REJECTED
  // Không lấy chỉ số bàn giao ban đầu
  // findTenantReadings: async (
  //   contractId: bigint,
  //   userId: bigint
  // ) => {
  //   return prisma.meter_readings.findMany({
  //     where: {
  //       contract_id: contractId,
  //       created_by: userId,

  //       period_month: {
  //         not: null,
  //       },

  //       period_year: {
  //         not: null,
  //       },
  //     },
  //     orderBy: [
  //       {
  //         reading_date: "desc",
  //       },
  //       {
  //         created_at: "desc",
  //       },
  //       {
  //         id: "desc",
  //       },
  //     ],
  //   });
  // },

  findTenantReadings(contractId: bigint) {
  return prisma.meter_readings.findMany({
    where: {
      contract_id: contractId,
      period_month: {
        not: null,
      },
      period_year: {
        not: null,
      },
    },
    orderBy: [
      { reading_date: "desc" },
      { created_at: "desc" },
    ],
    include: {
      users: {
        select: {
          id: true,
          profiles: {
            select: {
              full_name: true,
            },
          },
        },
      },
    },
  });
}
};
