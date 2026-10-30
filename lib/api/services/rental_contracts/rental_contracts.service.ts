import { Prisma, rental_contracts } from "@/generated/prisma/client";
import type { PaginationResult } from "@/lib/types/api.type";
import {
  rentalContractRepository,
  RentalContractWithDetails,
  type CreateFullContractParams,
  type FindManyRentalContractParams,
} from "../../repositories/rental_contracts/rental_contracts.repository";

export const rentalContractService = {
  getRentalContracts: async (
    params: FindManyRentalContractParams,
  ): Promise<PaginationResult<rental_contracts>> => {
    try {
      const page = Number(params.page) > 0 ? Number(params.page) : 1;
      const limit = Number(params.limit) > 0 ? Number(params.limit) : 10;
      const expiringInDays = params.expiringInDays
        ? Number(params.expiringInDays)
        : 30;

      const { rental_contracts, total } =
        await rentalContractRepository.findMany({
          ...params,
          page,
          limit,
          expiringInDays,
        });

      return {
        data: rental_contracts,
        total,
        page,
        limit,
        totalPage: Math.ceil(total / limit),
      };
    } catch (err) {
      throw new Error("SERVER_ERROR");
    }
  },

  getById: async (id: bigint): Promise<RentalContractWithDetails> => {
    try {
      const rental_contract = await rentalContractRepository.findById(id);

      if (!rental_contract) throw new Error("RENTAL_CONTRACT_NOT_FOUND");

      return rental_contract;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "RENTAL_CONTRACT_NOT_FOUND"
      ) {
        throw error;
      }
      throw new Error("SERVER_ERROR");
    }
  },

  createRentalContract: async (params: CreateFullContractParams) => {
    try {
      return await rentalContractRepository.createRentalContracts(params);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // lỗi trung lặp
        if (error.code === "P2002") {
          throw new Error("RENTAL_CONTRACT_EXISTS");
        }
      }

      throw new Error("SERVER_ERROR");
    }
  },

  updateRentalContract: async (
    id: bigint,
    input: Prisma.rental_contractsUpdateInput,
  ): Promise<RentalContractWithDetails> => {
    try {
      return await rentalContractRepository.updateRentalContract(id, input);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // lỗi trung lặp
        if (error.code === "P2002") {
          throw new Error("RENTAL_CONTRACT_EXISTS");
        }

        // lỗi không tìm thấy hợp đồng cần update
        if (error.code === "P2025") {
          throw new Error("RENTAL_CONTRACT_NOT_FOUND");
        }
      }
      throw new Error("SERVER_ERROR");
    }
  },

  deleteRentalContract: async (id: bigint): Promise<rental_contracts> => {
    try {
      return await rentalContractRepository.deleteRentalContract(id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new Error("RENTAL_CONTRACT_NOT_FOUND");
        }

        // lỗi đang được sử dụng
        if (error.code === "P2003") {
          throw new Error("RENTAL_CONTRACT_IN_USE");
        }
      }
      throw new Error("SERVER_ERROR");
    }
  },
};
