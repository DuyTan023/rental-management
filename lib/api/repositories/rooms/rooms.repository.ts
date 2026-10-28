import type { Prisma, rooms } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { FindManyParams } from "../../../types/api.type";
type FindManyResultRooms = {
  rooms: RoomWithCurrentContract[];
  total: number;
};

export type CurrentContract = Prisma.rental_contractsGetPayload<{
  include: {
    contract_tenants: {
      where: {
        status: "ACTIVE";
      };
      include: {
        profiles: true;
      };
    };
  };
}>; // Hợp đồng có ng thuê đang ở

type RoomServiceDetails = Prisma.room_servicesGetPayload<{
  include: {
    services: true;
  };
}>; // Dịch vụ phòng đang sử dụng

export type RoomWithCurrentContract = rooms & {
  current_contract: CurrentContract | null;
  room_services: RoomServiceDetails[];
}; // Phòng gồm thông tin chi tiết phòng, hợp đồng hiện tại, số ng thuê hiện tại theo hợp đồng, dịch vụ đang được sử dụng

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
    const [roomRows, total] = await prisma.$transaction([
      prisma.rooms.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "asc" },
        include: {
          rental_contracts: {
            where: { status: "ACTIVE" },
            orderBy: { id: "desc" },
            take: 1,
            include: {
              contract_tenants: {
                where: { status: "ACTIVE" },
                include: {
                  profiles: true,
                },
              },
            },
          },
          room_services: {
            where: { effective_to: null },
            include: {
              services: true,
            },
          },
        },
      }),
      prisma.rooms.count({
        where,
      }),
    ]);

    const result: RoomWithCurrentContract[] = roomRows.map(
      ({ rental_contracts, ...room }) => ({
        ...room,
        current_contract: rental_contracts[0] ?? null,
      }),
    );
    return { rooms: result, total };
  },

  // Lấy phòng cho thuê theo tìm kiếm số mã phòng

  findByRoomNumber: async (room_number: string): Promise<rooms | null> => {
    return prisma.rooms.findFirst({
      where: { room_number: room_number },
    });
  },

  // Lấy phòng theo ID
  findById: async (id: bigint): Promise<RoomWithCurrentContract | null> => {
    const room = await prisma.rooms.findUnique({
      where: { id },
      include: {
        rental_contracts: {
          where: { status: "ACTIVE" },
          orderBy: { id: "desc" },
          take: 1,
          include: {
            contract_tenants: {
              where: { status: "ACTIVE" },
              include: {
                profiles: true,
              },
            },
          },
        },
        room_services: {
          where: { effective_to: null },
          include: {
            services: true,
          },
        },
      },
    });

    if (!room) return null;

    const { rental_contracts, ...roomData } = room;

    return {
      ...roomData,
      current_contract: rental_contracts[0] ?? null,
      room_services: room.room_services,
    };
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
