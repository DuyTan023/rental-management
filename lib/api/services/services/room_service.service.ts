import { Prisma, room_services } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { roomServiceRepository, RoomServiceWithService } from "../../repositories/services/room_service.repository";

export const roomServiceService = {
  // Chẩn hóa ngày về Date theo UTC
  normalizeDate: (date: Date): Date => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new Error("INVALID_DATE");
    }
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  },

  // Thêm dịch vụ vào phòng
  createRoomService: async (
    input: Prisma.room_servicesCreateInput,
  ): Promise<room_services> => {
    try {
      return await roomServiceRepository.createRoomService(input);
    } catch (error) {

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new Error("ROOM_SERVICE_EXISTS");
        }
        if (error.code === "P2003") {
          throw new Error("ROOM_SERVICE_NOT_FOUND");
        }
      }

      throw new Error("SERVER_ERROR");
    }
  },
// createRoomService: async (
//   input: Prisma.room_servicesCreateInput,
// ): Promise<room_services> => {
//   try {
//     return await roomServiceRepository.createRoomService(input);
//   } catch (error) {
//     console.error("Lỗi createRoomService:", error);
//     throw error;
//   }
// },
  // Lấy dịch vụ và giá của phòng theo ngày áp dụng các trường hợp tiềm kiếm lập hóa đơn bổ sung
  getRoomServiceByDate: async (
    room_id: bigint,
    service_id: bigint,
    date: Date,
  ): Promise<room_services> => {
    try {
      // chuẩn hóa ngày về UTC
      const checkDate = roomServiceService.normalizeDate(date);

      const roomService = await roomServiceRepository.findByRoomId(
        room_id,
        service_id,
        checkDate,
      );

      if (!roomService) {
        throw new Error("ROOM_SERVICE_NOT_FOUND");
      }

      return roomService;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === "ROOM_SERVICE_NOT_FOUND" ||
          error.message === "INVALID_DATE")
      ) {
        throw error;
      }
      throw new Error("SERVER_ERROR");
    }
  },

  // Lấy giá hiện đang áp dụng cho phòng
  getCurrentRoomService: async (
    room_id: bigint,
    service_id: bigint,
  ): Promise<room_services> => {
    try {
      const room_service = await roomServiceRepository.findCurrentRoomService(
        room_id,
        service_id,
      );

      if (!room_service) {
        throw new Error("ROOM_SERVICE_NOT_FOUND");
      }

      return room_service;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "ROOM_SERVICE_NOT_FOUND") {
          throw error;
        }
      }
      throw new Error("SERVER_ERROR");
    }
  },

  // Thay đổi giá dịch vụ của phòng và lưu lịch sử giá (tạo 1 record mới lưu giá mới đồng thời đóng thời hạn record giá hiện tại)
  changeRoomServicePrice: async (
    room_id: bigint,
    service_id: bigint,
    unit_price: number,
    effective_from: Date,
  ): Promise<room_services> => {
    try {
      //Chuẩn hóa ngày áp dụng giá mới
      const newStart = roomServiceService.normalizeDate(effective_from);

      // Kiểm tra giá mặc định là số và lớn hơn 0

      if (!Number.isFinite(unit_price) || unit_price < 0) {
        throw new Error("INVALID_UNIT_PRICE");
      }

      return await prisma.$transaction(async (tx) => {
        // Tìm giá đang được áp dụng
        const oldPrice = await roomServiceRepository.findCurrentRoomService(
          room_id,
          service_id,
          tx,
        );

        if (!oldPrice) {
          throw new Error("ROOM_SERVICE_NOT_FOUND");
        }

        //Chuẩn hóa ngày bắt đầu giá hiện tại
        const oldStart = roomServiceService.normalizeDate(
          oldPrice.effective_from,
        );

        // Ngày đổi giá phải sau ngày bắt đầu giá cũ
        if (newStart <= oldStart) {
          throw new Error("INVALID_EFFECTIVE_DATE");
        }

        // Ngày kết thúc giá cũ là ngày trước khi áp dụng giá mới
        const oldEnd = new Date(newStart);
        oldEnd.setUTCDate(oldEnd.getUTCDate() - 1);

        // Đóng thời gian áp dụng giá cũ
        await roomServiceRepository.updateEffectiveTo(oldPrice.id, oldEnd, tx);

        // Tạo bản ghi giá mới
        return await roomServiceRepository.createNewRoomServicePrice(
          oldPrice.room_id,
          oldPrice.service_id,
          unit_price,
          newStart,
          tx,
        );
      });
    } catch (error) {
      if (error instanceof Error) {
        const knownErrors = [
          "INVALID_UNIT_PRICE",
          "INVALID_DATE",
          "ROOM_SERVICE_NOT_FOUND",
          "INVALID_EFFECTIVE_DATE",
        ];

        if (knownErrors.includes(error.message)) {
          throw error;
        }
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new Error("ROOM_SERVICE_EXISTS");
        }

        if (error.code === "P2003") {
          throw new Error("ROOM_OR_SERVICE_NOT_FOUND");
        }

        if (error.code === "P2025") {
          throw new Error("ROOM_SERVICE_NOT_FOUND");
        }
      }

      throw new Error("SERVER_ERROR");
    }
  },

  // Ngừng áp dụng dịch vụ cho phòng
  stopRoomService: async (
    room_id: bigint,
    service_id: bigint,
    effective_to: Date,
  ): Promise<room_services> => {
    try {
      // Chuẩn hóa ngày kết thúc
      const newEnd = roomServiceService.normalizeDate(effective_to);

      // Tìm bản ghi dịch vụ đang hoạt động và cập nhật ngày kết thúc
      const room_service = await roomServiceRepository.stopRoomService(
        room_id,
        service_id,
        newEnd,
      );

      if (!room_service) {
        throw new Error("ROOM_SERVICE_NOT_FOUND");
      }

      // Chuẩn hóa ngày bắt đầu để kiểm tra ngày kết thúc
      const startDate = roomServiceService.normalizeDate(
        room_service.effective_from,
      );

      // Ngày kết thúc phải sau ngày bắt đầu
      if (newEnd < startDate) {
        throw new Error("INVALID_EFFECTIVE_DATE");
      }

      return room_service;
    } catch (error) {
      if (error instanceof Error) {
        const knownErrors = [
          "INVALID_DATE",
          "ROOM_SERVICE_NOT_FOUND",
          "INVALID_EFFECTIVE_DATE",
          "ROOM_SERVICE_ALREADY_STOPPED",
        ];

        if (knownErrors.includes(error.message)) {
          throw error;
        }
      }

      throw new Error("SERVER_ERROR");
    }
  },

  // Lấy danh sách dịch vụ đang được sử dụng của phòng
  getActiveByRoomId: async (roomId: bigint): Promise<RoomServiceWithService[]> => {
    try {
      const room_services =
        await roomServiceRepository.findActiveByRoomId(roomId);

      if (room_services.length === 0) {
        throw new Error("ROOM_SERVICES_NOT_FOUND");
      }
      return room_services;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "ROOM_SERVICES_NOT_FOUND"
      ) {
        throw error;
      }
      throw new Error("SERVER_ERROR");
    }
  },

  // Lấy danh sách dịch vụ đang được sử dụng của phòng
  getRoomServiceHistory: async (roomId: bigint): Promise<RoomServiceWithService[]> => {
    try {
      const room_services =
        await roomServiceRepository.findRoomServiceHistory(roomId);

      return room_services;
    } catch (error) {
      throw new Error("SERVER_ERROR");
    }
  },
};
