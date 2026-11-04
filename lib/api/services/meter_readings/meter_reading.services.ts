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

      const { meter_readings, total } = await meterReadingRepository.findMany({
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
    input: Prisma.meter_readingsCreateInput,
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
    input: Prisma.meter_readingsUpdateInput,
  ): Promise<meter_readings> => {
    try {
      const existingMeterReading = await meterReadingRepository.findById(id);

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
      const existingMeterReading = await meterReadingRepository.findById(id);

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

// import { Prisma } from "@/generated/prisma/client";
// import {
//   meterReadingRepository,
//   type FindManyParams,
// } from "@/lib/api/repositories/meter_readings/meter_reading.repository";

// export const meterReadingService = {
//   // Lấy chi tiết chỉ số
//   async getMeterReadingById(id: bigint) {
//     const reading = await meterReadingRepository.findById(id);

//     if (!reading) {
//       throw new Error("Không tìm thấy bản ghi chỉ số.");
//     }

//     return reading;
//   },

//   // Lấy danh sách chỉ số có phân trang
//   async getMeterReadings(params: FindManyParams) {
//     const { page = 1, limit = 10 } = params;

//     if (page < 1 || limit < 1 || limit > 100) {
//       throw new Error("Thông tin phân trang không hợp lệ.");
//     }

//     const result = await meterReadingRepository.findMany(params);

//     return {
//       meter_readings: result.meter_readings,
//       pagination: {
//         page,
//         limit,
//         total: result.total,
//         totalPages: Math.ceil(result.total / limit),
//       },
//     };
//   },

//   // Tạo chỉ số ban đầu khi bàn giao
//   async createInitialMeterReading(input: {
//     room_id: bigint;
//     contract_id: bigint;
//     service_id: bigint;
//     meter_type: "WATER" | "ELECTRICITY";
//     reading_date: Date;
//     period_month: number;
//     period_year: number;
//     initial_value: Prisma.Decimal | string | number;
//     image_url?: string | null;
//     note?: string | null;
//     created_by?: bigint | null;
//   }) {
//     const {
//       room_id,
//       contract_id,
//       service_id,
//       meter_type,
//       reading_date,
//       period_month,
//       period_year,
//       initial_value,
//       image_url,
//       note,
//       created_by,
//     } = input;

//     if (
//       !Number.isInteger(period_month) ||
//       period_month < 1 ||
//       period_month > 12 ||
//       !Number.isInteger(period_year) ||
//       period_year < 1
//     ) {
//       throw new Error("Tháng hoặc năm ghi chỉ số không hợp lệ.");
//     }

//     if (
//       reading_date.getMonth() + 1 !== period_month ||
//       reading_date.getFullYear() !== period_year
//     ) {
//       throw new Error("Ngày ghi chỉ số không khớp kỳ ghi chỉ số.");
//     }

//     const value = new Prisma.Decimal(initial_value);

//     if (!value.isFinite() || value.isNegative()) {
//       throw new Error("Chỉ số ban đầu phải là số không âm hợp lệ.");
//     }

//     const existing = await meterReadingRepository.findByRoomServicePeriod({
//       room_id,
//       service_id,
//       period_month,
//       period_year,
//     });

//     if (existing) {
//       throw new Error("Chỉ số của dịch vụ trong kỳ này đã tồn tại.");
//     }

//     return meterReadingRepository.createMeterReading({
//       rooms: { connect: { id: room_id } },
//       rental_contracts: { connect: { id: contract_id } },
//       services: { connect: { id: service_id } },
//       ...(created_by != null && {
//         users: { connect: { id: created_by } },
//       }),
//       meter_type,
//       reading_date,
//       period_month,
//       period_year,
//       old_value: value,
//       new_value: value,
//       consumption: new Prisma.Decimal(0),
//       status: "APPROVED",
//       image_url: image_url ?? null,
//       note: note ?? null,
//     });
//   },

//   // Người thuê gửi chỉ số mới
//   async submitMeterReading(input: {
//     room_id: bigint;
//     contract_id: bigint;
//     service_id: bigint;
//     meter_type: "WATER" | "ELECTRICITY";
//     reading_date: Date;
//     period_month: number;
//     period_year: number;
//     new_value: Prisma.Decimal | string | number;
//     image_url?: string | null;
//     note?: string | null;
//     created_by?: bigint | null;
//   }) {
//     const {
//       room_id,
//       contract_id,
//       service_id,
//       meter_type,
//       reading_date,
//       period_month,
//       period_year,
//       new_value,
//       image_url,
//       note,
//       created_by,
//     } = input;

//     if (
//       !Number.isInteger(period_month) ||
//       period_month < 1 ||
//       period_month > 12 ||
//       !Number.isInteger(period_year) ||
//       period_year < 1
//     ) {
//       throw new Error("Tháng hoặc năm ghi chỉ số không hợp lệ.");
//     }

//     if (
//       reading_date.getMonth() + 1 !== period_month ||
//       reading_date.getFullYear() !== period_year
//     ) {
//       throw new Error("Ngày ghi chỉ số không khớp kỳ ghi chỉ số.");
//     }

//     if (reading_date.getDate() < 1 || reading_date.getDate() > 4) {
//       throw new Error("Chỉ được gửi chỉ số từ ngày 1 đến ngày 4.");
//     }

//     const value = new Prisma.Decimal(new_value);

//     if (!value.isFinite() || value.isNegative()) {
//       throw new Error("Chỉ số mới phải là số không âm hợp lệ.");
//     }

//     const existing = await meterReadingRepository.findByRoomServicePeriod({
//       room_id,
//       service_id,
//       period_month,
//       period_year,
//     });

//     if (existing) {
//       throw new Error("Chỉ số của dịch vụ trong kỳ này đã tồn tại.");
//     }

//     const previous = await meterReadingRepository.findLatestApproved({
//       room_id,
//       service_id,
//       reading_date,
//     });

//     if (!previous) {
//       throw new Error("Chưa có chỉ số APPROVED trước đó.");
//     }

//     const oldValue = new Prisma.Decimal(previous.new_value);

//     if (value.lessThan(oldValue)) {
//       throw new Error("Chỉ số mới không được nhỏ hơn chỉ số cũ.");
//     }

//     return meterReadingRepository.createMeterReading({
//       rooms: { connect: { id: room_id } },
//       rental_contracts: { connect: { id: contract_id } },
//       services: { connect: { id: service_id } },
//       ...(created_by != null && {
//         users: { connect: { id: created_by } },
//       }),
//       meter_type,
//       reading_date,
//       period_month,
//       period_year,
//       old_value: oldValue,
//       new_value: value,
//       consumption: value.minus(oldValue),
//       status: "PENDING",
//       image_url: image_url ?? null,
//       note: note ?? null,
//     });
//   },

//   // Duyệt hoặc từ chối chỉ số
//   async reviewMeterReading(id: bigint, status: "APPROVED" | "REJECTED") {
//     const reading = await this.getMeterReadingById(id);

//     if (reading.status !== "PENDING") {
//       throw new Error("Chỉ được duyệt bản ghi đang PENDING.");
//     }

//     return meterReadingRepository.updateMeterReading(id, {
//       status,
//     });
//   },

//   // Cập nhật chỉ số
//   async updateMeterReading(
//     id: bigint,
//     input: {
//       new_value?: Prisma.Decimal | string | number;
//       reading_date?: Date;
//       period_month?: number;
//       period_year?: number;
//       image_url?: string | null;
//       note?: string | null;
//     },
//   ) {
//     const reading = await this.getMeterReadingById(id);

//     if (reading.status !== "PENDING" && reading.status !== "APPROVED") {
//       throw new Error("Không thể cập nhật chỉ số ở trạng thái này.");
//     }

//     const newValue =
//       input.new_value !== undefined
//         ? new Prisma.Decimal(input.new_value)
//         : new Prisma.Decimal(reading.new_value);

//     const oldValue = new Prisma.Decimal(reading.old_value);

//     if (
//       !newValue.isFinite() ||
//       newValue.isNegative() ||
//       newValue.lessThan(oldValue)
//     ) {
//       throw new Error("Chỉ số mới không hợp lệ.");
//     }

//     const readingDate = input.reading_date ?? reading.reading_date;
//     const month = input.period_month ?? reading.period_month;
//     const year = input.period_year ?? reading.period_year;

//     if (month == null || year == null) {
//       throw new Error("Tháng hoặc năm ghi chỉ số không được để trống.");
//     }

//     if (
//       !Number.isInteger(month) ||
//       month < 1 ||
//       month > 12 ||
//       !Number.isInteger(year) ||
//       year < 1 ||
//       readingDate.getMonth() + 1 !== month ||
//       readingDate.getFullYear() !== year
//     ) {
//       throw new Error("Ngày ghi chỉ số và kỳ ghi chỉ số không hợp lệ.");
//     }

//     return meterReadingRepository.updateMeterReading(id, {
//       ...(input.new_value !== undefined && {
//         new_value: newValue,
//         consumption: newValue.minus(oldValue),
//       }),
//       ...(input.reading_date !== undefined && {
//         reading_date: readingDate,
//       }),
//       ...(input.period_month !== undefined && {
//         period_month: month,
//       }),
//       ...(input.period_year !== undefined && {
//         period_year: year,
//       }),
//       ...(input.image_url !== undefined && {
//         image_url: input.image_url,
//       }),
//       ...(input.note !== undefined && {
//         note: input.note,
//       }),
//     });
//   },

//   // Xóa chỉ số chưa được duyệt hoặc đã bị từ chối
//   async deleteMeterReading(id: bigint) {
//     const reading = await this.getMeterReadingById(id);

//     if (reading.status !== "PENDING" && reading.status !== "REJECTED") {
//       throw new Error("Chỉ được xóa chỉ số PENDING hoặc REJECTED.");
//     }

//     return meterReadingRepository.deleteMeterReading(id);
//   },
// };
