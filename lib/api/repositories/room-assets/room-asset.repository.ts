
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export const roomAssetRepository = {
  findRoomById(roomId: bigint) {
    return prisma.rooms.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        room_number: true,
      },
    });
  },

  findById(id: bigint) {
    return prisma.room_assets.findUnique({
      where: { id },
      include: {
        rooms: {
          select: {
            id: true,
            room_number: true,
          },
        },
      },
    });
  },

  findByRoom(roomId: bigint, includeInactive = false) {
    return prisma.room_assets.findMany({
      where: {
        room_id: roomId,
        ...(includeInactive ? {} : { is_active: true }),
      },
      orderBy: [
        { is_active: "desc" },
        { created_at: "desc" },
      ],
    });
  },

  create(data: Prisma.room_assetsCreateInput) {
    return prisma.room_assets.create({
      data,
      include: {
        rooms: {
          select: {
            id: true,
            room_number: true,
          },
        },
      },
    });
  },

  update(id: bigint, data: Prisma.room_assetsUpdateInput) {
    return prisma.room_assets.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        rooms: {
          select: {
            id: true,
            room_number: true,
          },
        },
      },
    });
  },

  findActiveTenantContract(userId: bigint) {
    return prisma.contract_tenants.findFirst({
      where: {
        status: "ACTIVE",
        left_at: null,
        profiles: {
          is: {
            user_id: userId,
          },
        },
        rental_contracts: {
          is: {
            status: "ACTIVE",
          },
        },
      },
      include: {
        rental_contracts: {
          include: {
            rooms: {
              select: {
                id: true,
                room_number: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  },

  findActiveAssetsByRoom(roomId: bigint) {
    return prisma.room_assets.findMany({
      where: {
        room_id: roomId,
        is_active: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  },
};
