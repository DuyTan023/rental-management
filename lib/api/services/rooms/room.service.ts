import { Prisma, rooms } from "@/generated/prisma/client";
import type { PaginationResult } from "@/lib/types/api.type";
import { roomRepository } from "../../repositories/rooms/rooms.repository";

type GetRoomParams = {
  page?: number;
  limit?: number;
  keyword?: string;
};

export const roomService = {
  getRoom: async ({
    page = 1,
    limit = 10,
    keyword,
  }: GetRoomParams): Promise<PaginationResult<rooms>> => {
    try {
      const { rooms, total } = await roomRepository.findMany({
        page,
        limit,
        keyword,
      });
      return {
        data: rooms,
        total: total,
        page: page,
        limit: limit,
        totalPage: Math.ceil(total / limit),
      };
    } catch {
      throw new Error("SERVER_ERROR");
    }
  },

  getRooomByNumber: async (room_number: string): Promise<rooms> => {
    try {
      const room = await roomRepository.findByRoomNumber(room_number);

      // Lỗi không tìm thấy
      if (!room) throw new Error("ROOM_NOT_FOUND");
      return room;
    } catch (error) {
      if (error instanceof Error && error.message === "ROOM_NOT_FOUND") {
        throw error;
      }

      throw new Error("SERVER_ERROR");
    }
  },

  getRooomById: async (id: bigint): Promise<rooms> => {
    try {
      const room = await roomRepository.findById(id);

      // lỗi không tìm thấy
      if (!room) throw new Error("ROOM_NOT_FOUND");
      return room;
    } catch (error) {
      if (error instanceof Error && error.message === "ROOM_NOT_FOUND") {
        throw error;
      }
      throw new Error("SERVER_ERROR");
    }
  },

  createRoom: async (input: Prisma.roomsCreateInput): Promise<rooms> => {
    try {
      return await roomRepository.createRoom(input);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // lỗi trung lặp
        if (error.code === "P2002") {
          throw new Error("ROOM_EXISTS");
        }
      }

      throw new Error("SERVER_ERROR");
    }
  },

  updateRoom: async (
    id: bigint,
    input: Prisma.roomsUpdateInput,
  ): Promise<rooms> => {
    try {
      return await roomRepository.updateRoom(id, input);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // lỗi trung lặp
        if (error.code === "P2002") {
          throw new Error("ROOM_EXISTS");
        }

        // lỗi không tìm thấy room cần update
        if (error.code === "P2025") {
          throw new Error("ROOM_NOT_FOUND");
        }
      }
      throw new Error("SERVER_ERROR");
    }
  },

  deleteRoom: async (id: bigint): Promise<rooms> => {
    try {
      return roomRepository.deleteRoom(id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // lỗi phòng không tồn tại
        if (error.code === "P2025") {
          throw new Error("ROOM_NOT_FOUND");
        }

        // lỗi đang được sử dụng
        if (error.code === "P2003") {
          throw new Error("ROOM_IN_USE");
        }
      }

      throw new Error("SERVER_ERROR");
    }
  },
};
