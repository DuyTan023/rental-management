// import { meter_readings, Prisma } from "@/generated/prisma/client";
// import { prisma } from "@/lib/prisma";
// export type FindManyParams = {
//   room_id: bigint;
//   contract_id: bigint;
//   page?: number;
//   limit?: number;
//   period_month?: number;
//   period_year?: number;
//   status?: meter_readings["status"];
//   meter_type?: meter_readings["meter_type"];
// };
// type FindManyResultMeterReading = {
//   meter_readings: meter_readings[];
//   total: number;
// };
// export const meterReadingRepository = {
//   // Thêm mới chỉ số
//   createMeterReading: async (
//     input: Prisma.meter_readingsCreateInput,
//   ): Promise<meter_readings> => {
//     return prisma.meter_readings.create({
//       data: input,
//     });
//   },

//   // Lấy chi tiết chỉ số theo id
//   findById: async (id: bigint): Promise<meter_readings | null> => {
//     return prisma.meter_readings.findUnique({
//       where: { id },
//     });
//   },

//   // Lấy danh sách các bản ghi chỉ số theo phòng và theo hợp đồng có phân trang
//   findMany: async ({
//     room_id,
//     contract_id,
//     page = 1,
//     limit = 10,
//     period_month,
//     period_year,
//     status,
//     meter_type,
//   }: FindManyParams): Promise<FindManyResultMeterReading> => {
//     const skip = (page - 1) * limit;
//     const where: Prisma.meter_readingsWhereInput = {
//       room_id,
//       contract_id,
//       ...(period_month !== undefined && {
//         period_month,
//       }),
//       ...(period_year !== undefined && {
//         period_year,
//       }),
//       ...(status !== undefined && { status }),
//       ...(meter_type !== undefined && { meter_type }),
//     };
//     const [data, total] = await prisma.$transaction([
//       prisma.meter_readings.findMany({
//         where,
//         orderBy: [{ reading_date: "desc" }, { id: "desc" }],
//         skip,
//         take: limit,
//       }),
//       prisma.meter_readings.count({ where }),
//     ]);

//     return { meter_readings: data, total };
//   },

//   // Tìm chỉ số APPROVED gần nhất trước ngày ghi chỉ số lấy chỉ số đã xác nhận gần nhất dùng cho làm chỉ số cũ
//   findLatestApproved: async ({
//     room_id,
//     service_id,
//     reading_date,
//   }: {
//     room_id: bigint;
//     service_id: bigint;
//     reading_date: Date;
//   }): Promise<meter_readings | null> => {
//     return prisma.meter_readings.findFirst({
//       where: {
//         room_id,
//         service_id,
//         status: "APPROVED",
//         reading_date: {
//           lt: reading_date,
//         },
//       },
//       orderBy: [{ reading_date: "desc" }, { id: "desc" }],
//     });
//   },

//   // Tìm bản ghi cùng phòng, dịch vụ và ngày
//   findByRoomServiceDate: async ({
//     room_id,
//     service_id,
//     reading_date,
//   }: {
//     room_id: bigint;
//     service_id: bigint;
//     reading_date: Date;
//   }): Promise<meter_readings | null> => {
//     return prisma.meter_readings.findFirst({
//       where: {
//         room_id,
//         service_id,
//         reading_date,
//       },
//     });
//   },

//   // Tìm bản ghi theo phòng, dịch vụ và kỳ tháng/năm
//   findByRoomServicePeriod: async ({
//     room_id,
//     service_id,
//     period_month,
//     period_year,
//   }: {
//     room_id: bigint;
//     service_id: bigint;
//     period_month: number;
//     period_year: number;
//   }): Promise<meter_readings | null> => {
//     return prisma.meter_readings.findFirst({
//       where: {
//         room_id,
//         service_id,
//         period_month,
//         period_year,
//       },
//       orderBy: [{ reading_date: "desc" }, { id: "desc" }],
//     });
//   },

//   updateMeterReading: async (
//     id: bigint,
//     input: Prisma.meter_readingsUpdateInput,
//   ): Promise<meter_readings> => {
//     return prisma.meter_readings.update({
//       where: { id },
//       data: input,
//     });
//   },

//   deleteMeterReading: async (id: bigint) => {
//     return prisma.meter_readings.delete({
//       where: { id },
//     });
//   },
// };

import { meter_readings, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
export type FindManyParams = {
  room_id: bigint;
  contract_id: bigint;
  page?: number;
  limit?: number;
};
type FindManyResultMeterReading = {
  meter_readings: meter_readings[];
  total: number;
};
export const meterReadingRepository = {
  // Thêm mớ chỉ số
  createMeterReading: async (
    input: Prisma.meter_readingsCreateInput,
  ): Promise<meter_readings> => {
    return prisma.meter_readings.create({
      data: input,
    });
  },

  // Lấy chi tiết chỉ số theo id
  findById: async (id: bigint): Promise<meter_readings | null> => {
    return prisma.meter_readings.findUnique({
      where: { id },
    });
  },

  // Lấy danh sách các bản ghi chỉ số theo phòng và theo hợp đồng có phân trang
  findMany: async ({
    room_id,
    contract_id,
    page = 1,
    limit = 10,
  }: FindManyParams): Promise<FindManyResultMeterReading> => {
    const skip = (page - 1) * limit;
    const [data, total] = await prisma.$transaction([
      prisma.meter_readings.findMany({
        where: {
          room_id,
          contract_id,
        },
        orderBy: [{ reading_date: "desc" }, { id: "desc" }],
        skip,
        take: limit,
      }),
      prisma.meter_readings.count({
        where: {
          room_id,
          contract_id,
        },
      }),
    ]);

    return { meter_readings: data, total };
  },

  updateMeterReading: async (
    id: bigint,
    input: Prisma.meter_readingsUpdateInput,
  ): Promise<meter_readings> => {
    return prisma.meter_readings.update({
      where: { id },
      data: input,
    });
  },

  deleteMeterReading: async (id: bigint) => {
    return prisma.meter_readings.delete({
      where: { id },
    });
  },
};
