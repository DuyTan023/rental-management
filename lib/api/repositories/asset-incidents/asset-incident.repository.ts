
import { prisma } from "@/lib/prisma";
import {
  Prisma,
  incident_status,
} from "@/generated/prisma/client";

const incidentInclude = {
  rooms: {
    select: {
      id: true,
      room_number: true,
    },
  },
  room_assets: {
    select: {
      id: true,
      name: true,
      condition: true,
    },
  },
  rental_contracts: {
    select: {
      id: true,
      contract_number: true,
    },
  },
  users: {
    select: {
      id: true,
      email: true,
      profiles: {
        select: {
          full_name: true,
          phone: true,
        },
      },
    },
  },
  asset_incident_updates: {
    orderBy: {
      created_at: "desc" as const,
    },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          profiles: {
            select: {
              full_name: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.asset_incidentsInclude;

export const assetIncidentRepository = {
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

  findRoomAsset(assetId: bigint, roomId: bigint) {
    return prisma.room_assets.findFirst({
      where: {
        id: assetId,
        room_id: roomId,
        is_active: true,
      },
      select: {
        id: true,
        name: true,
      },
    });
  },

  create(
    data: Prisma.asset_incidentsCreateInput,
    userId: bigint
  ) {
    return prisma.$transaction(async (tx) => {
      const incident = await tx.asset_incidents.create({
        data,
      });

      await tx.asset_incident_updates.create({
        data: {
          incident_id: incident.id,
          updated_by: userId,
          old_status: null,
          new_status: incident_status.PENDING,
          note: "Người thuê gửi báo cáo sự cố",
        },
      });

      return tx.asset_incidents.findUniqueOrThrow({
        where: {
          id: incident.id,
        },
        include: incidentInclude,
      });
    });
  },

  // findTenantIncidents(
  //   userId: bigint,
  //   skip: number,
  //   take: number
  // ) {
  //   return prisma.$transaction(async (tx) => {
  //     const where: Prisma.asset_incidentsWhereInput = {
  //       reported_by: userId,
  //     };

  //     const [items, total] = await Promise.all([
  //       tx.asset_incidents.findMany({
  //         where,
  //         include: incidentInclude,
  //         orderBy: {
  //           created_at: "desc",
  //         },
  //         skip,
  //         take,
  //       }),
  //       tx.asset_incidents.count({ where }),
  //     ]);

  //     return {
  //       items,
  //       pagination: {
  //         total,
  //         page: Math.floor(skip / take) + 1,
  //         limit: take,
  //         totalPages: Math.ceil(total / take),
  //       },
  //     };
  //   });
  // },

  findTenantIncidents(
    roomIds: bigint[],
    skip: number,
    take: number
  ) {
    return prisma.$transaction(async (tx) => {
      const where: Prisma.asset_incidentsWhereInput = {
        room_id: {
          in: roomIds,
        },
      };

      const [items, total] = await Promise.all([
        tx.asset_incidents.findMany({
          where,
          include: incidentInclude,
          orderBy: {
            created_at: "desc",
          },
          skip,
          take,
        }),

        tx.asset_incidents.count({ where }),
      ]);

      return {
        items,
        pagination: {
          total,
          page: Math.floor(skip / take) + 1,
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      };
    });
  },

  findLandlordIncidents(
    where: Prisma.asset_incidentsWhereInput,
    skip: number,
    take: number
  ) {
    return prisma.$transaction(async (tx) => {
      const [items, total] = await Promise.all([
        tx.asset_incidents.findMany({
          where,
          include: incidentInclude,
          orderBy: {
            created_at: "desc",
          },
          skip,
          take,
        }),
        tx.asset_incidents.count({ where }),
      ]);

      return {
        items,
        pagination: {
          total,
          page: Math.floor(skip / take) + 1,
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      };
    });
  },

  findById(id: bigint) {
    return prisma.asset_incidents.findUnique({
      where: { id },
      include: incidentInclude,
    });
  },

  async updateStatus(params: {
    id: bigint;
    updatedBy: bigint;
    oldStatus: incident_status;
    newStatus: incident_status;
    note?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.asset_incidents.updateMany({
        where: {
          id: params.id,
          status: params.oldStatus,
        },
        data: {
          status: params.newStatus,
          resolution_note:
            params.newStatus === incident_status.RESOLVED ||
            params.newStatus === incident_status.REJECTED
              ? params.note ?? null
              : null,
          resolved_at:
            params.newStatus === incident_status.RESOLVED
              ? new Date()
              : null,
          updated_at: new Date(),
        },
      });

      if (result.count !== 1) {
        return null;
      }

      await tx.asset_incident_updates.create({
        data: {
          incident_id: params.id,
          updated_by: params.updatedBy,
          old_status: params.oldStatus,
          new_status: params.newStatus,
          note: params.note?.trim() || null,
        },
      });

      return tx.asset_incidents.findUnique({
        where: {
          id: params.id,
        },
        include: incidentInclude,
      });
    });
  },

  findActiveTenantRoomIds(userId: bigint) {
    return prisma.contract_tenants.findMany({
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
      select: {
        rental_contracts: {
          select: {
            room_id: true,
          },
        },
      },
    });
  },
};
