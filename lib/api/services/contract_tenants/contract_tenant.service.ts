import { Prisma, contract_tenants, rental_contract_status } from "@/generated/prisma/client";
import { contractTenantRepository } from "../../repositories/contract_tenants/contract_tenant.repository";
import { rentalContractService } from "../rental_contracts/rental_contracts.service";

export const contractTenantService = {
  createContractTenant: async (
    contractId: bigint,
    profileId: bigint,
    role: Prisma.contract_tenantsCreateInput["role"],
  ): Promise<contract_tenants> => {
    try {
      return await contractTenantRepository.createContractTenant(
        contractId,
        profileId,
        role,
      );
    } catch (error) {
      if (error instanceof Error) {
        const businessErrors = [
          "CONTRACT_NOT_FOUND",
          "ROOM_CAPACITY_EXCEEDED",
        ];

        if (businessErrors.includes(error.message)) {
          throw error;
        }
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new Error("CONTRACT_TENANT_EXISTS");
        }

        if (error.code === "P2003") {
          throw new Error("INVALID_RELATION");
        }

        if (error.code === "P2025") {
          throw new Error("RELATED_RECORD_NOT_FOUND");
        }
      }

      throw new Error("SERVICE_ERROR");
    }
  },

  leaveContract: async (
    contractId: bigint,
    tenantId: bigint,
  ) => {
    try {
      // 1. Kiểm tra hợp đồng tồn tại
      const contract =
        await rentalContractService.getById(contractId);

      if (!contract) {
        throw new Error("CONTRACT_NOT_FOUND");
      }

      // 2. Chỉ cho rời hợp đồng đang hoạt động
      if (contract.status !== rental_contract_status.ACTIVE) {
        throw new Error("CONTRACT_NOT_ACTIVE");
      }

      // 3. Xử lý cho người thuê rời hợp đồng
      const result = await contractTenantRepository.leaveContract(
        contractId,
        tenantId,
      );

      // Repository trả null nếu người thuê không tồn tại
      // hoặc không còn ACTIVE
      if (!result) {
        throw new Error("CONTRACT_TENANT_NOT_FOUND_OR_INACTIVE");
      }

      return result;
    } catch (error) {
      // Giữ nguyên các lỗi nghiệp vụ đã xác định
      if (error instanceof Error) {
        const businessErrors = [
          "CONTRACT_NOT_FOUND",
          "CONTRACT_NOT_ACTIVE",
          "CONTRACT_TENANT_NOT_FOUND_OR_INACTIVE",
        ];

        if (businessErrors.includes(error.message)) {
          throw error;
        }
      }

      // Chuyển lỗi Prisma thành lỗi nghiệp vụ phù hợp
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new Error("CONTRACT_TENANT_NOT_FOUND");
        }

        if (error.code === "P2003") {
          throw new Error("INVALID_RELATION");
        }
      }

      console.error("Lỗi contractTenantService.leaveContract:", error);
      throw new Error("SERVER_ERROR");
    }
  },
};