
import { meter_type } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { meterReadingRepository } from "../../repositories/meter_readings/meter_reading.repository";

export type CreateMeterReadingInput =
  | {
      type: "INITIAL_HANDOVER";
      roomId: bigint;
      contractId: bigint;
      readingDate: Date;
      note?: string | null;
      readings: [
        {
          meterType: "ELECTRICITY";
          serviceId: bigint;
          newValue: number;
        },
        {
          meterType: "WATER";
          serviceId: bigint;
          newValue: number;
        }
      ];
    }
  | {
    type: "MONTHLY_REPORT";
    roomId: bigint;
    serviceId: bigint;
    meterType: meter_type;
    readingDate: Date;
    periodMonth: number;
    periodYear: number;
    newValue: number;
    imageUrl: string;
  };

const meterTypes: meter_type[] = ["ELECTRICITY", "WATER"];

export const meterReadingService = {
  // =====================================
  // CREATE
  // =====================================

  create: async (
    created_by: bigint,
    input: CreateMeterReadingInput
  ) => {
    try {
      const user = await prisma.users.findUnique({
        where: { id: created_by },
      });

      if (!user) throw new Error("USER_NOT_FOUND");
      if (user.status !== "ACTIVE") throw new Error("USER_INACTIVE");

      // Chủ trọ tạo chỉ số bàn giao
      if (input.type === "INITIAL_HANDOVER") {
        if (user.role !== "LANDLORD") {
          throw new Error("FORBIDDEN");
        }

        const electricity = input.readings.find(
          (item) => item.meterType === "ELECTRICITY"
        );

        const water = input.readings.find(
          (item) => item.meterType === "WATER"
        );

        if (!electricity || !water) {
          throw new Error("INVALID_INITIAL_READINGS");
        }

        return await meterReadingRepository.createInitialReadings(
          created_by,
          {
            roomId: input.roomId,
            contractId: input.contractId,
            readingDate: input.readingDate,
            note: input.note,
            electricity: {
              serviceId: electricity.serviceId,
              value: electricity.newValue,
            },
            water: {
              serviceId: water.serviceId,
              value: water.newValue,
            },
          }
        );
      }

      // Người thuê gửi báo cáo hàng tháng
      if (input.type === "MONTHLY_REPORT") {
        if (user.role !== "TENANT") {
          throw new Error("FORBIDDEN");
        }

        // 1. Kiểm tra phòng
        const room = await meterReadingRepository.findRoomById(
          input.roomId
        );

        if (!room) throw new Error("ROOM_NOT_FOUND");

        // 2. Lấy hợp đồng ACTIVE
        const contract =
          await meterReadingRepository.findActiveContract(input.roomId);

        if (!contract) throw new Error("ACTIVE_CONTRACT_NOT_FOUND");

        // 3. Lấy profile
        const profile =
          await meterReadingRepository.findProfileByUserId(created_by);

        if (!profile) throw new Error("PROFILE_NOT_FOUND");

        // 4. Kiểm tra người thuê thuộc hợp đồng
        const contractTenant =
          await meterReadingRepository.findContractTenant(
            contract.id,
            profile.id
          );

        if (!contractTenant) throw new Error("NOT_CONTRACT_TENANT");

        // 5. Kiểm tra thời gian gửi: ngày 1 - 3
        // const now = new Date();

        // if (now.getDate() < 1 || now.getDate() > 3) {
        //   throw new Error("SUBMISSION_PERIOD_CLOSED");
        // }

        const isTestMode =
          process.env.METER_READING_TEST_MODE === "true";

        const now = new Date();

        if (
          !isTestMode &&
          (now.getDate() < 1 || now.getDate() > 3)
        ) {
          throw new Error("SUBMISSION_PERIOD_CLOSED");
        }



        const { periodMonth, periodYear } = input;

        if (
          !Number.isInteger(periodMonth) ||
          periodMonth < 1 ||
          periodMonth > 12 ||
          !Number.isInteger(periodYear) ||
          periodYear < 2000
        ) {
          throw new Error("INVALID_PERIOD");
        }

        // 6. Kiểm tra loại đồng hồ
        if (!meterTypes.includes(input.meterType)) {
          throw new Error("INVALID_METER_TYPE");
        }

        // 7. Kiểm tra báo cáo cùng kỳ
      const existing =
        await meterReadingRepository.findExistingReading(
          input.roomId,
          contract.id,
          input.meterType,
          periodMonth,
          periodYear
        );

        if (existing) throw new Error("READING_ALREADY_SUBMITTED");

        // 8. Lấy chỉ số APPROVED gần nhất
        const latestReading =
          await meterReadingRepository.findLatestApprovedReading(
            input.roomId,
            contract.id,
            input.meterType
          );

        if (!latestReading) {
          throw new Error("INITIAL_READING_NOT_FOUND");
        }

        // 9. Kiểm tra chỉ số mới
        const oldValue = Number(latestReading.new_value);
        const newValue = input.newValue;

        if (
          !Number.isFinite(newValue) ||
          newValue < oldValue ||
          newValue < 0
        ) {
          throw new Error("INVALID_READING_VALUE");
        }


        // 10. Tạo báo cáo
        return await meterReadingRepository.create(created_by, {
          rooms: {
            connect: { id: input.roomId },
          },
          rental_contracts: {
            connect: { id: contract.id },
          },
          services: {
            connect: { id: input.serviceId },
          },
          meter_type: input.meterType,
          reading_date: input.readingDate,
          old_value: oldValue,
          new_value: newValue,
          image_url: input.imageUrl,
          period_month: periodMonth,
          period_year: periodYear,
          status: "PENDING",
        });
      }

      throw new Error("INVALID_TYPE");
    } catch (error) {
      console.error("Error create meter_reading:", error);

      const allowedErrors = [
        "USER_NOT_FOUND",
        "USER_INACTIVE",
        "FORBIDDEN",
        "INVALID_INITIAL_READINGS",
        "INVALID_TYPE",
        "ROOM_NOT_FOUND",
        "ACTIVE_CONTRACT_NOT_FOUND",
        "PROFILE_NOT_FOUND",
        "NOT_CONTRACT_TENANT",
        "SUBMISSION_PERIOD_CLOSED",
        "INVALID_METER_TYPE",
        "READING_ALREADY_SUBMITTED",
        "INITIAL_READING_NOT_FOUND",
        "INVALID_READING_VALUE",
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

  // =====================================
  // GET 1: Chỉ số hiện tại của phòng
  // =====================================

  getCurrentReadings: async (roomId: bigint) => {
    try {
      const room = await meterReadingRepository.findRoomById(roomId);

      if (!room) throw new Error("ROOM_NOT_FOUND");

      const contract =
        await meterReadingRepository.findActiveContract(roomId);

      if (!contract) throw new Error("ACTIVE_CONTRACT_NOT_FOUND");

      const readings = await Promise.all(
        meterTypes.map(async (meterType) => {
          const reading =
            await meterReadingRepository.findLatestApprovedReading(
              roomId,
              contract.id,
              meterType
            );

          if (!reading) {
            return {
              meterType,
              currentValue: null,
              readingDate: null,
              source: null,
            };
          }

          return {
            meterType,
            currentValue: Number(reading.new_value),
            readingDate: reading.reading_date,
            source:
              reading.period_month === null &&
              reading.period_year === null
                ? "INITIAL_HANDOVER"
                : "MONTHLY_REPORT",
          };
        })
      );

      return {
        roomId,
        contractId: contract.id,
        readings,
      };
    } catch (error) {
      console.error("Error get current meter readings:", error);

      if (
        error instanceof Error &&
        ["ROOM_NOT_FOUND", "ACTIVE_CONTRACT_NOT_FOUND"].includes(
          error.message
        )
      ) {
        throw error;
      }

      throw new Error("SERVER_ERROR");
    }
  },

  // =====================================
  // GET 2: Chỉ số bàn giao của hợp đồng
  // =====================================

  getInitialReadings: async (contractId: bigint) => {
    try {
      const contract =
        await meterReadingRepository.findContractById(contractId);

      if (!contract) throw new Error("CONTRACT_NOT_FOUND");

      const readings =
        await meterReadingRepository.findInitialReadings(contractId);

      return {
        contractId,
        readings: readings.map((reading) => ({
          id: reading.id,
          meterType: reading.meter_type,
          oldValue: Number(reading.old_value),
          newValue: Number(reading.new_value),
          consumption: Number(reading.consumption),
          readingDate: reading.reading_date,
          note: reading.note,
          serviceId: reading.service_id,
        })),
      };
    } catch (error) {
      console.error("Error get initial meter readings:", error);

      if (
        error instanceof Error &&
        error.message === "CONTRACT_NOT_FOUND"
      ) {
        throw error;
      }

      throw new Error("SERVER_ERROR");
    }
  },

  // =====================================
  // GET 3: Danh sách báo cáo theo kỳ
  // =====================================

  getReadingsByPeriod: async (
    month: number,
    year: number
  ) => {
    try {
      // 1. Kiểm tra kỳ
      if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12 ||
        !Number.isInteger(year) ||
        year < 2000
      ) {
        throw new Error("INVALID_PERIOD");
      }

      // 2. Lấy danh sách phòng và báo cáo trong kỳ
      const [rooms, readings] = await Promise.all([
        meterReadingRepository.findRoomsWithActiveContracts(),
        meterReadingRepository.findReadingsByPeriod(month, year),
      ]);

      // 3. Nhóm báo cáo theo hợp đồng
      const readingsByContract = new Map<string, typeof readings>();

      for (const reading of readings) {
        // Bỏ qua bản ghi không thuộc hợp đồng nào
        if (reading.contract_id === null) continue;

        const key = reading.contract_id.toString();
        const current = readingsByContract.get(key) ?? [];

        current.push(reading);
        readingsByContract.set(key, current);
      }

      // 4. Ghép báo cáo vào từng phòng
      const items = rooms.map((room) => {
        const contract = room.rental_contracts[0];

        if (!contract) {
          throw new Error("ACTIVE_CONTRACT_NOT_FOUND");
        }

        const contractReadings =
          readingsByContract.get(contract.id.toString()) ?? [];

        const getLatestReading = (meterType: meter_type) => {
          return (
            contractReadings.find(
              (reading) => reading.meter_type === meterType
            ) ?? null
          );
        };

        const electricity = getLatestReading("ELECTRICITY");
        const water = getLatestReading("WATER");

        const isSubmitted = (reading: typeof electricity) =>
          reading !== null &&
          (reading.status === "PENDING" ||
            reading.status === "APPROVED");

        const electricitySubmitted = isSubmitted(electricity);
        const waterSubmitted = isSubmitted(water);

        let status: "COMPLETED" | "PARTIAL" | "MISSING";

        if (electricitySubmitted && waterSubmitted) {
          status = "COMPLETED";
        } else if (electricitySubmitted || waterSubmitted) {
          status = "PARTIAL";
        } else {
          status = "MISSING";
        }

        const formatReading = (reading: typeof electricity) => {
          if (!reading) return null;

          return {
            id: reading.id,
            meterType: reading.meter_type,
            oldValue: Number(reading.old_value),
            newValue: Number(reading.new_value),
            consumption: Number(reading.consumption),
            readingDate: reading.reading_date,
            status: reading.status,
            imageUrl: reading.image_url,
            note: reading.note,
            submittedBy: reading.users?.id ?? null,
          };
        };

        return {
          roomId: room.id,
          roomNumber: room.room_number,
          contractId: contract.id,
          tenants: contract.contract_tenants.map((tenant) => ({
            profileId: tenant.profiles.id,
            fullName: tenant.profiles.full_name,
          })),
          status,
          readings: {
            electricity: formatReading(electricity),
            water: formatReading(water),
          },
        };
      });

      // 5. Thống kê
      const summary = {
        totalRooms: items.length,
        completed: items.filter(
          (item) => item.status === "COMPLETED"
        ).length,
        partial: items.filter(
          (item) => item.status === "PARTIAL"
        ).length,
        missing: items.filter(
          (item) => item.status === "MISSING"
        ).length,
      };

      return {
        month,
        year,
        summary,
        items,
      };
    } catch (error) {
      console.error("Error get meter readings by period:", error);

      if (
        error instanceof Error &&
        error.message === "INVALID_PERIOD"
      ) {
        throw error;
      }

      throw new Error("SERVER_ERROR");
    }
  },

  getById: async (id: bigint) => {
    try {
      const meter_reading = await meterReadingRepository.findById(id);
      if (!meter_reading) throw new Error("METER_READING_NOT_FOUND");

      return meter_reading;
    } catch (error) {
      console.log("Error get by id: "+ error)
      if (error instanceof Error && error.message === "METER_READING_NOT_FOUND") {
        throw error
      }
      throw new Error("SERVER_ERROR");
    }
  },

    updateStatus: async (
    id: bigint,
    status: "APPROVED" | "REJECTED" | "WITHDRAWN",
    note?: string
  ) => {
    try {
      const reading = await meterReadingRepository.findById(id);

      if (!reading) {
        throw new Error("METER_READING_NOT_FOUND");
      }

      if (reading.status !== "PENDING") {
        throw new Error("METER_READING_ALREADY_PROCESSED");
      }

      if (status === "REJECTED" && !note?.trim()) {
        throw new Error("REJECTION_REASON_REQUIRED");
      }

      const result = await meterReadingRepository.updatePendingStatus(
        id,
        status,
        note?.trim()
      );

      if (result.count === 0) {
        throw new Error("METER_READING_ALREADY_PROCESSED");
      }

      return {
        id,
        status,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        [
          "METER_READING_NOT_FOUND",
          "METER_READING_ALREADY_PROCESSED",
          "REJECTION_REASON_REQUIRED",
        ].includes(error.message)
      ) {
        throw error;
      }

      console.error("Error updating meter reading status:", error);
      throw new Error("SERVER_ERROR");
    }
  },
};
