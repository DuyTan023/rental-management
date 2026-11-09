  import { meter_readings, meter_type, Prisma } from "@/generated/prisma/client";
  import { prisma } from "@/lib/prisma";

  type CreateInitialReadingsInput = {
    roomId: bigint;
    contractId: bigint;
    readingDate: Date;
    note?: string | null;
    electricity: {
      serviceId: bigint;
      value: number;
    };
    water: {
      serviceId: bigint;
      value: number;
    };
  };

  export const meterReadingRepository = {
    // Tạo một bản ghi báo cáo chỉ số điện/nước cho người thuê
    create: async (
      create_By: bigint,
      input: Prisma.meter_readingsCreateInput
    ): Promise<meter_readings> => {
      return prisma.meter_readings.create({
        data: {
          ...input,
          users: {
            connect: {
              id: create_By,
            },
          },
        },
      });
    },

    // Tạo đồng thời chỉ số điện và nước lúc bàn giao
    createInitialReadings: async (
      created_by: bigint,
      input: CreateInitialReadingsInput
    ): Promise<meter_readings[]> => {
      return prisma.$transaction(async (tx) => {
        const electricity = await tx.meter_readings.create({
          data: {
            meter_type: "ELECTRICITY",
            reading_date: input.readingDate,
            note: input.note ?? null,
            old_value: input.electricity.value,
            new_value: input.electricity.value,
            status: "APPROVED",
            period_month: null,
            period_year: null,

            rooms: {
              connect: { id: input.roomId },
            },
            rental_contracts: {
              connect: { id: input.contractId },
            },
            services: {
              connect: { id: input.electricity.serviceId },
            },
            users: {
              connect: { id: created_by },
            },
          },
        });

        const water = await tx.meter_readings.create({
          data: {
            meter_type: "WATER",
            reading_date: input.readingDate,
            note: input.note ?? null,
            old_value: input.water.value,
            new_value: input.water.value,
            status: "APPROVED",
            period_month: null,
            period_year: null,

            rooms: {
              connect: { id: input.roomId },
            },
            rental_contracts: {
              connect: { id: input.contractId },
            },
            services: {
              connect: { id: input.water.serviceId },
            },
            users: {
              connect: { id: created_by },
            },
          },
        });

        return [electricity, water];
      });
    },

    // =====================================
    // Các hàm truy vấn dùng chung
    // =====================================

    // Lấy hợp đồng đang hoạt động của phòng
    findActiveContract: async (roomId: bigint) => {
      return prisma.rental_contracts.findFirst({
        where: {
          room_id: roomId,
          status: "ACTIVE",
        },
      });
    },

    // Kiểm tra người thuê có thuộc hợp đồng không
    findContractTenant: async (
      contractId: bigint,
      profileId: bigint
    ) => {
      return prisma.contract_tenants.findFirst({
        where: {
          contract_id: contractId,
          profile_id: profileId,
          status: "ACTIVE",
        },
      });
    },

    // Lấy profile theo userId
    findProfileByUserId: async (userId: bigint) => {
      return prisma.profiles.findUnique({
        where: {
          user_id: userId,
        },
      });
    },

    // Lấy phòng theo ID
    findRoomById: async (id: bigint) => {
      return prisma.rooms.findUnique({
        where: { id },
      });
    },

    // Lấy chỉ số APPROVED gần nhất của từng loại đồng hồ
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
          { reading_date: "desc" },
          { id: "desc" },
        ],
      });
    },

    // Lấy chỉ số bàn giao ban đầu của hợp đồng
    findInitialReadings: async (contractId: bigint) => {
      return prisma.meter_readings.findMany({
        where: {
          contract_id: contractId,
          period_month: null,
          period_year: null,
        },
        orderBy: {
          meter_type: "asc",
        },
      });
    },

    // Kiểm tra báo cáo cùng kỳ của hợp đồng
    // Chỉ lấy PENDING hoặc APPROVED
    findExistingReading: async (
      roomId: bigint,
      contractId: bigint,
      meterType: meter_type,
      month: number,
      year: number
    ) => {
      return prisma.meter_readings.findFirst({
        where: {
          room_id: roomId,
          contract_id: contractId,
          meter_type: meterType,
          period_month: month,
          period_year: year,
          status: {
            in: ["PENDING", "APPROVED"],
          },
        },
      });
    },

    // Lấy danh sách báo cáo theo hợp đồng và kỳ
    findReadingsByContractAndPeriod: async (
      contractId: bigint,
      month: number,
      year: number
    ) => {
      return prisma.meter_readings.findMany({
        where: {
          contract_id: contractId,
          period_month: month,
          period_year: year,
        },
        orderBy: [
          { reading_date: "desc" },
          { id: "desc" },
        ],
      });
    },

    // Lấy danh sách phòng đang có hợp đồng ACTIVE
    findRoomsWithActiveContracts: async () => {
      return prisma.rooms.findMany({
        where: {
          rental_contracts: {
            some: {
              status: "ACTIVE",
            },
          },
        },
        include: {
          rental_contracts: {
            where: {
              status: "ACTIVE",
            },
            include: {
              contract_tenants: {
                where: {
                  status: "ACTIVE",
                },
                include: {
                  profiles: true,
                },
              },
            },
          },
        },
        orderBy: {
          room_number: "asc",
        },
      });
    },

    // Lấy tất cả báo cáo chỉ số theo kỳ của các hợp đồng ACTIVE
    findReadingsByPeriod: async (
      month: number,
      year: number
    ) => {
      return prisma.meter_readings.findMany({
        where: {
          period_month: month,
          period_year: year,
          rental_contracts: {
            status: "ACTIVE",
          },
        },
        include: {
          rooms: true,
          rental_contracts: {
            include: {
              contract_tenants: {
                where: {
                  status: "ACTIVE",
                },
                include: {
                  profiles: true,
                },
              },
            },
          },
          services: true,
          users: true,
        },
        orderBy: [
          { reading_date: "desc" },
          { id: "desc" },
        ],
      });
    },

    // Lấy hợp đồng theo ID
    findContractById: async (contractId: bigint) => {
      return prisma.rental_contracts.findUnique({
        where: {
          id: contractId,
        },
      });
    },

    findById: async (id: bigint): Promise<meter_readings | null> => {
      return prisma.meter_readings.findUnique({
        where: { id },
      });
    },

    updatePendingStatus: async (
      id: bigint,
      status: "APPROVED" | "REJECTED" | "WITHDRAWN",
      note?: string
    ) => {
      return prisma.meter_readings.updateMany({
        where: {
          id,
          status: "PENDING",
        },
        data: {
          status,
          ...(note !== undefined ? { note } : {}),
        },
      });
    },
  };