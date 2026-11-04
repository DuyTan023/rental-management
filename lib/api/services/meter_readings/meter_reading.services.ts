
import { meter_readings, Prisma } from "@/generated/prisma/client";
import { PaginationResult } from "@/lib/types/api.type";
import { meterReadingRepository } from "../../repositories/meter_readings/meter_reading.repository";

type GetMeterReadingParams = {
    room_id: bigint;
    contract_id: bigint;
    page?: number;
    limit?: number;
};

export const meterReadingService = {
    // Lấy danh sách chỉ số theo phòng và hợp đồng
    getMeterReading: async ({
        room_id,
        contract_id,
        page = 1,
        limit = 10,
    }: GetMeterReadingParams): Promise<PaginationResult<meter_readings>> => {
        try {
            if (page < 1 || limit < 1) {
                throw new Error("INVALID_PAGINATION");
            }

            const { meter_readings, total } =
                await meterReadingRepository.findMany({
                    room_id,
                    contract_id,
                    page,
                    limit,
                });

            return {
                data: meter_readings,
                total,
                page,
                limit,
                totalPage: Math.ceil(total / limit),
            };
        } catch (error) {
            if (error instanceof Error && error.message === "INVALID_PAGINATION") {
                throw error;
            }

            throw new Error("SERVER_ERROR");
        }
    },

    // Lấy chi tiết chỉ số theo ID
    getById: async (id: bigint): Promise<meter_readings> => {
        try {
            const meterReading = await meterReadingRepository.findById(id);

            if (!meterReading) {
                throw new Error("METER_READING_NOT_FOUND");
            }

            return meterReading;
        } catch (error) {
            if (
                error instanceof Error &&
                error.message === "METER_READING_NOT_FOUND"
            ) {
                throw error;
            }

            throw new Error("SERVER_ERROR");
        }
    },

    // Tạo bản ghi chỉ số
    createMeterReading: async (
        input: Prisma.meter_readingsCreateInput
    ): Promise<meter_readings> => {
        try {
            return await meterReadingRepository.createMeterReading(input);
        } catch (error) {
            throw new Error("SERVER_ERROR");
        }
    },

    // Cập nhật bản ghi chỉ số
    updateMeterReading: async (
        id: bigint,
        input: Prisma.meter_readingsUpdateInput
    ): Promise<meter_readings> => {
        try {
            const existingMeterReading =
                await meterReadingRepository.findById(id);

            if (!existingMeterReading) {
                throw new Error("METER_READING_NOT_FOUND");
            }

            return await meterReadingRepository.updateMeterReading(id, input);
        } catch (error) {
            if (
                error instanceof Error &&
                error.message === "METER_READING_NOT_FOUND"
            ) {
                throw error;
            }

            throw new Error("SERVER_ERROR");
        }
    },

    // Xóa bản ghi chỉ số
    deleteMeterReading: async (id: bigint): Promise<meter_readings> => {
        try {
            const existingMeterReading =
                await meterReadingRepository.findById(id);

            if (!existingMeterReading) {
                throw new Error("METER_READING_NOT_FOUND");
            }

            return await meterReadingRepository.deleteMeterReading(id);
        } catch (error) {
            if (
                error instanceof Error &&
                error.message === "METER_READING_NOT_FOUND"
            ) {
                throw error;
            }

            throw new Error("SERVER_ERROR");
        }
    },
};
