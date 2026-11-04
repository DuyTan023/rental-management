import { meter_readings, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
export type FindManyParams = {
    room_id: bigint, 
    contract_id: bigint, 
    page?: number;
    limit?: number;
};
type FindManyResultMeterReading = {
  meter_readings: meter_readings[];
  total: number;
};
export const meterReadingRepository = {
    // Thêm mớ chỉ số
    createMeterReading: async(input: Prisma.meter_readingsCreateInput): Promise<meter_readings> => {
        return prisma.meter_readings.create({
            data: input,
        })
    },

    // Lấy chi tiết chỉ số theo id
    findById: async(id: bigint): Promise<meter_readings | null> => {
        return prisma.meter_readings.findUnique({
            where: {id}
        })
    },

    // Lấy danh sách các bản ghi chỉ số theo phòng và theo hợp đồng có phân trang
    findMany: async({
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
                orderBy: [
                    { reading_date: "desc" },
                    { id: "desc" },
                ],
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

        return {meter_readings: data, total}
    },

    updateMeterReading: async(id: bigint, input: Prisma.meter_readingsUpdateInput): Promise<meter_readings> => {
        return prisma.meter_readings.update({
            where: {id},
            data: input,
        })
    },

    deleteMeterReading: async(id: bigint) => {
        return prisma.meter_readings.delete({
            where: {id}
        })
    }


}