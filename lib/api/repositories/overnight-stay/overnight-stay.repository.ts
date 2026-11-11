
// import { prisma } from "@/lib/prisma";

// export const overnightStayRepository = {
//   // Tìm profile theo tài khoản đăng nhập
//   findProfileByUserId(userId: bigint) {
//     return prisma.profiles.findUnique({
//       where: {
//         user_id: userId,
//       },
//     });
//   },

//   // Kiểm tra người thuê có thuộc hợp đồng ACTIVE không
//   findActiveContract(contractId: bigint, profileId: bigint) {
//     return prisma.rental_contracts.findFirst({
//       where: {
//         id: contractId,
//         status: "ACTIVE",
//         contract_tenants: {
//           some: {
//             profile_id: profileId,
//             status: "ACTIVE",
//           },
//         },
//       },
//     });
//   },

//   // Tạo thông báo
//   create(data: any) {
//     return prisma.overnight_stays.create({
//       data,
//       include: {
//         rental_contracts: {
//           include: {
//             rooms: true,
//           },
//         },
//         profiles: true,
//       },
//     });
//   },

//   // Danh sách thông báo của người thuê
//   findManyByTenant(
//     profileId: bigint,
//     skip: number,
//     take: number
//   ) {
//     return prisma.overnight_stays.findMany({
//       where: {
//         tenant_profile_id: profileId,
//       },
//       include: {
//         rental_contracts: {
//           include: {
//             rooms: true,
//           },
//         },
//       },
//       orderBy: {
//         created_at: "desc",
//       },
//       skip,
//       take,
//     });
//   },

//   countByTenant(profileId: bigint) {
//     return prisma.overnight_stays.count({
//       where: {
//         tenant_profile_id: profileId,
//       },
//     });
//   },

//   // Chi tiết thông báo của người thuê
//   findByTenantId(id: bigint, profileId: bigint) {
//     return prisma.overnight_stays.findFirst({
//       where: {
//         id,
//         tenant_profile_id: profileId,
//       },
//       include: {
//         rental_contracts: {
//           include: {
//             rooms: true,
//           },
//         },
//         profiles: true,
//       },
//     });
//   },

//   // Cập nhật thông báo
//   update(id: bigint, data: any) {
//     return prisma.overnight_stays.update({
//       where: { id },
//       data,
//       include: {
//         rental_contracts: {
//           include: {
//             rooms: true,
//           },
//         },
//       },
//     });
//   },

//   // Hủy thông báo
//   delete(id: bigint) {
//     return prisma.overnight_stays.delete({
//       where: { id },
//     });
//   },

//   // Danh sách tất cả thông báo cho landlord
//   findManyForLandlord(
//     skip: number,
//     take: number,
//     status?: "PENDING" | "COMPLETED" | "CANCELLED"
//   ) {
//     return prisma.overnight_stays.findMany({
//       where: status
//         ? { notification_status: status }
//         : {},
//       include: {
//         rental_contracts: {
//           include: {
//             rooms: true,
//           },
//         },
//         profiles: true,
//         users: true,
//       },
//       orderBy: {
//         created_at: "desc",
//       },
//       skip,
//       take,
//     });
//   },

//   countForLandlord(
//     status?: "PENDING" | "COMPLETED" | "CANCELLED"
//   ) {
//     return prisma.overnight_stays.count({
//       where: status
//         ? { notification_status: status }
//         : {},
//     });
//   },

//   // Chi tiết dành cho landlord
//   findById(id: bigint) {
//     return prisma.overnight_stays.findUnique({
//       where: { id },
//       include: {
//         rental_contracts: {
//           include: {
//             rooms: true,
//           },
//         },
//         profiles: true,
//         users: true,
//       },
//     });
//   },

//   async updateIfPending(id: bigint, data: any) {
//     const result = await prisma.overnight_stays.updateMany({
//       where: {
//         id,
//         notification_status: "PENDING",
//       },
//       data,
//     });

//     if (result.count === 0) {
//       return null;
//     }

//     return prisma.overnight_stays.findUnique({
//       where: { id },
//     });
//   },
// };



import { prisma } from "@/lib/prisma";
import {
  Prisma,
  notification_status,
} from "@/generated/prisma/client";

type NotificationStatus = notification_status;

type CreateOvernightStayRepositoryInput = {
  contract_id: bigint;
  tenant_profile_id: bigint;
  guest_name: string;
  guest_identity_number?: string | null;
  guest_phone?: string | null;
  guest_address?: string | null;
  check_in_at: Date;
  check_out_at: Date;
  note?: string | null;
  notification_status: NotificationStatus;
};

type UpdateOvernightStayRepositoryInput = {
  guest_name?: string;
  guest_identity_number?: string | null;
  guest_phone?: string | null;
  guest_address?: string | null;
  check_in_at?: Date;
  check_out_at?: Date;
  actual_check_out_at?: Date | null;
  note?: string | null;
};

type CompleteNotificationInput = {
  notification_status: "COMPLETED";
  notified_by: bigint;
  notification_at: Date;
};

const tenantInclude = {
  rental_contracts: {
    include: {
      rooms: true,
    },
  },
  profiles: true,
} satisfies Prisma.overnight_staysInclude;

const landlordInclude = {
  rental_contracts: {
    include: {
      rooms: true,
    },
  },
  profiles: true,
  users: true,
} satisfies Prisma.overnight_staysInclude;

export const overnightStayRepository = {
  // ==========================================
  // PROFILE
  // ==========================================

  findProfileByUserId(userId: bigint) {
    return prisma.profiles.findUnique({
      where: {
        user_id: userId,
      },
    });
  },

  // ==========================================
  // CONTRACT
  // ==========================================

  findActiveContract(contractId: bigint, profileId: bigint) {
    return prisma.rental_contracts.findFirst({
      where: {
        id: contractId,
        status: "ACTIVE",
        contract_tenants: {
          some: {
            profile_id: profileId,
            status: "ACTIVE",
          },
        },
      },
      include: {
        rooms: true,
      },
    });
  },

  // ==========================================
  // TENANT - CREATE
  // ==========================================

  create(data: CreateOvernightStayRepositoryInput) {
    return prisma.overnight_stays.create({
      data,
      include: tenantInclude,
    });
  },

  // ==========================================
  // TENANT - LIST
  // ==========================================

  // findManyByTenant(
  //   profileId: bigint,
  //   skip: number,
  //   take: number,
  //   status?: NotificationStatus
  // ) {
  //   return prisma.overnight_stays.findMany({
  //     where: {
  //       tenant_profile_id: profileId,
  //       ...(status ? { notification_status: status } : {}),
  //     },
  //     include: tenantInclude,
  //     orderBy: [
  //       {
  //         created_at: "desc",
  //       },
  //       {
  //         id: "desc",
  //       },
  //     ],
  //     skip,
  //     take,
  //   });
  // },


  findManyByTenant(
    roomIds: bigint[],
    skip: number,
    take: number,
    status?: NotificationStatus
  ) {
    return prisma.overnight_stays.findMany({
      where: {
        rental_contracts: {
          is: {
            room_id: {
              in: roomIds,
            },
          },
        },
        ...(status ? { notification_status: status } : {}),
      },
      include: tenantInclude,
      orderBy: [
        {
          created_at: "desc",
        },
        {
          id: "desc",
        },
      ],
      skip,
      take,
    });
  },

  // countByTenant(
  //   profileId: bigint,
  //   status?: NotificationStatus
  // ) {
  //   return prisma.overnight_stays.count({
  //     where: {
  //       tenant_profile_id: profileId,
  //       ...(status ? { notification_status: status } : {}),
  //     },
  //   });
  // },

  countByTenant(
    roomIds: bigint[],
    status?: NotificationStatus
  ) {
    return prisma.overnight_stays.count({
      where: {
        rental_contracts: {
          is: {
            room_id: {
              in: roomIds,
            },
          },
        },
        ...(status ? { notification_status: status } : {}),
      },
    });
  },

  // Thống kê toàn bộ lịch sử, không phụ thuộc bộ lọc
  // async getTenantStatistics(profileId: bigint) {
  //   const grouped = await prisma.overnight_stays.groupBy({
  //     by: ["notification_status"],
  //     where: {
  //       tenant_profile_id: profileId,
  //     },
  //     _count: {
  //       _all: true,
  //     },
  //   });

  //   const statistics = {
  //     total: 0,
  //     pending: 0,
  //     completed: 0,
  //     cancelled: 0,
  //   };

  //   for (const item of grouped) {
  //     const count = item._count._all;

  //     statistics.total += count;

  //     switch (item.notification_status) {
  //       case "PENDING":
  //         statistics.pending = count;
  //         break;

  //       case "COMPLETED":
  //         statistics.completed = count;
  //         break;

  //       case "CANCELLED":
  //         statistics.cancelled = count;
  //         break;
  //     }
  //   }

  //   return statistics;
  // },

  async getTenantStatistics(roomIds: bigint[]) {
    const grouped = await prisma.overnight_stays.groupBy({
      by: ["notification_status"],
      where: {
        rental_contracts: {
          is: {
            room_id: {
              in: roomIds,
            },
          },
        },
      },
      _count: {
        _all: true,
      },
    });

    const statistics = {
      total: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const item of grouped) {
      const count = item._count._all;

      statistics.total += count;

      switch (item.notification_status) {
        case "PENDING":
          statistics.pending = count;
          break;

        case "COMPLETED":
          statistics.completed = count;
          break;

        case "CANCELLED":
          statistics.cancelled = count;
          break;
      }
    }

    return statistics;
  },

  // ==========================================
  // TENANT - DETAIL
  // ==========================================

  // findByTenantId(id: bigint, profileId: bigint) {
  //   return prisma.overnight_stays.findFirst({
  //     where: {
  //       id,
  //       tenant_profile_id: profileId,
  //     },
  //     include: tenantInclude,
  //   });
  // },

  findByRoomIds(id: bigint, roomIds: bigint[]) {
    return prisma.overnight_stays.findFirst({
      where: {
        id,
        rental_contracts: {
          is: {
            room_id: {
              in: roomIds,
            },
          },
        },
      },
      include: tenantInclude,
    });
  },

  // ==========================================
  // TENANT - UPDATE
  // ==========================================

  async updateIfPending(
    id: bigint,
    profileId: bigint,
    data: UpdateOvernightStayRepositoryInput
  ) {
    const result = await prisma.overnight_stays.updateMany({
      where: {
        id,
        tenant_profile_id: profileId,
        notification_status: "PENDING",
      },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.overnight_stays.findFirst({
      where: {
        id,
        tenant_profile_id: profileId,
      },
      include: tenantInclude,
    });
  },

  // ==========================================
  // TENANT - CANCEL
  // ==========================================

  async cancelIfPending(id: bigint, profileId: bigint) {
    const result = await prisma.overnight_stays.updateMany({
      where: {
        id,
        tenant_profile_id: profileId,
        notification_status: "PENDING",
      },
      data: {
        notification_status: "CANCELLED",
      },
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.overnight_stays.findFirst({
      where: {
        id,
        tenant_profile_id: profileId,
      },
      include: tenantInclude,
    });
  },

  // ==========================================
  // LANDLORD - LIST
  // ==========================================

  findManyForLandlord(
    skip: number,
    take: number,
    status?: NotificationStatus
  ) {
    return prisma.overnight_stays.findMany({
      where: {
        ...(status ? { notification_status: status } : {}),
      },
      include: landlordInclude,
      orderBy: [
        {
          created_at: "desc",
        },
        {
          id: "desc",
        },
      ],
      skip,
      take,
    });
  },

  countForLandlord(status?: NotificationStatus) {
    return prisma.overnight_stays.count({
      where: {
        ...(status ? { notification_status: status } : {}),
      },
    });
  },

  // Thống kê toàn bộ lịch sử cho landlord
  async getLandlordStatistics() {
    const grouped = await prisma.overnight_stays.groupBy({
      by: ["notification_status"],
      _count: {
        _all: true,
      },
    });

    const statistics = {
      total: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const item of grouped) {
      const count = item._count._all;

      statistics.total += count;

      switch (item.notification_status) {
        case "PENDING":
          statistics.pending = count;
          break;

        case "COMPLETED":
          statistics.completed = count;
          break;

        case "CANCELLED":
          statistics.cancelled = count;
          break;
      }
    }

    return statistics;
  },

  // ==========================================
  // LANDLORD - DETAIL
  // ==========================================

  findById(id: bigint) {
    return prisma.overnight_stays.findUnique({
      where: {
        id,
      },
      include: landlordInclude,
    });
  },

  // ==========================================
  // LANDLORD - COMPLETE NOTIFICATION
  // ==========================================

  async completeIfPending(
    id: bigint,
    landlordId: bigint
  ) {
    const data: CompleteNotificationInput = {
      notification_status: "COMPLETED",
      notified_by: landlordId,
      notification_at: new Date(),
    };

    const result = await prisma.overnight_stays.updateMany({
      where: {
        id,
        notification_status: "PENDING",
      },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.overnight_stays.findUnique({
      where: {
        id,
      },
      include: landlordInclude,
    });
  },

  findActiveTenantRoomIds(profileId: bigint) {
    return prisma.contract_tenants.findMany({
      where: {
        profile_id: profileId,
        status: "ACTIVE",
        left_at: null,
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
