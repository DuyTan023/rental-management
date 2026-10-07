import type { Prisma, rooms } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { FindManyParams } from "../../../types/api.type";
type FindManyResultRooms = {
  rooms: rooms[];
  total: number;
};
export const roomRepository = {
  // Lấy danh sách phòng cho thuê có phân trang
  findMany: async ({
    page = 1,
    limit = 10,
    keyword,
  }: FindManyParams): Promise<FindManyResultRooms> => {
    const skip = (page - 1) * limit;

    const where: Prisma.roomsWhereInput = keyword
      ? {
          room_number: {
            contains: keyword,
            mode: "insensitive",
          },
        }
      : {};

    // Dùng $transaction chạy 2 query cùng lúc tránh race condition
    const [rooms, total] = await prisma.$transaction([
      prisma.rooms.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "asc" },
      }),
      prisma.rooms.count({
        where,
      }),
    ]);
    return { rooms, total };
  },

  // Lấy phòng cho thuê theo tìm kiếm số mã phòng

  findByRoomNumber: async (room_number: string): Promise<rooms | null> => {
    return prisma.rooms.findFirst({
      where: { room_number: room_number },
    });
  },

  //Lấy theo id
  findById: async (id: bigint): Promise<rooms | null> => {
    return prisma.rooms.findUnique({
      where: { id: id },
    });
  },

  // Thêm mới 1 phòng
  createRoom: async (input: Prisma.roomsCreateInput): Promise<rooms> => {
    return prisma.rooms.create({
      data: input,
    });
  },

  //Cập nhật phòng
  updateRoom: async (
    id: bigint,
    input: Prisma.roomsUpdateInput,
  ): Promise<rooms> => {
    return prisma.rooms.update({
      where: { id },
      data: input,
    });
  },

  // Xóa phòng
  deleteRoom: async (id: bigint): Promise<rooms> => {
    return prisma.rooms.delete({
      where: { id },
    });
  },
};
