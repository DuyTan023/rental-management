import {
  contract_tenants,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const contractTenantRepository = {
  createContractTenant: async (
    contractId: bigint,
    profileId: bigint,
    role: Prisma.contract_tenantsCreateInput["role"],
  ): Promise<contract_tenants> => {
    return prisma.$transaction(async (tx) => {
      // Lấy hợp đồng, thông tin phòng và số người đang ở
      const contract = await tx.rental_contracts.findUnique({
        where: {
          id: contractId,
        },
        include: {
          rooms: true,
          contract_tenants: {
            where: {
              status: "ACTIVE",
            },
            select: {
              id: true,
            },
          },
        },
      });

      if (!contract) {
        throw new Error("CONTRACT_NOT_FOUND");
      }

      // Kiểm tra sức chứa của phòng
      const currentOccupants = contract.contract_tenants.length;
      const maxOccupants = contract.rooms.max_occupants;

      if (currentOccupants >= maxOccupants) {
        throw new Error("ROOM_CAPACITY_EXCEEDED");
      }

      // Thêm người thuê vào hợp đồng
      return tx.contract_tenants.create({
        data: {
          rental_contracts: {
            connect: {
              id: contractId,
            },
          },
          profiles: {
            connect: {
              id: profileId,
            },
          },
          role,
          joined_at: new Date(),
        },
      });
    });
  },


leaveContract: async (
    contractId: bigint,
    tenantId: bigint,
  ) => {
    return prisma.$transaction(async (tx) => {
      // 1. Tìm người thuê trong hợp đồng
      const tenant = await tx.contract_tenants.findFirst({
        where: {
          id: tenantId,
          contract_id: contractId,
        },
      });

      if (!tenant || tenant.status !== "ACTIVE") {
        return null;
      }

      let promotedTenant = null;

      // 2. Nếu là đại diện, tìm người đang ở có joined_at gần nhất
      if (tenant.role === "REPRESENTATIVE") {
        const nextRepresentative =
          await tx.contract_tenants.findFirst({
            where: {
              contract_id: contractId,
              status: "ACTIVE",
              id: { not: tenantId },
            },
            orderBy: [
              { joined_at: "desc" },
              { id: "desc" },
            ],
          });

        // 3. Chuyển quyền đại diện cho người ở lại
        if (nextRepresentative) {
          promotedTenant = await tx.contract_tenants.update({
            where: {
              id: nextRepresentative.id,
            },
            data: {
              role: "REPRESENTATIVE",
            },
          });
        }
      }

      // 4. Cập nhật người thuê thành LEFT
      const leftTenant = await tx.contract_tenants.update({
        where: {
          id: tenantId,
        },
        data: {
          status: "LEFT",
        },
        include: {
          profiles: true,
        },
      });

      return {
        leftTenant,
        promotedTenant,
      };
    });
  },
};