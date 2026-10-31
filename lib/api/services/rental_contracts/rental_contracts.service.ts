import { Prisma, rental_contract_status, rental_contracts } from "@/generated/prisma/client";
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
      console.error(
        "========== ORIGINAL REPOSITORY ERROR ==========",
      );

      console.error(error);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error("Prisma code:", error.code);
        console.error("Prisma meta:", error.meta);
        console.error("Prisma message:", error.message);

        if (error.code === "P2002") {
          throw new Error("RENTAL_CONTRACT_EXISTS");
        }
      }

      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }

      console.error(
        "===============================================",
      );

      throw new Error("SERVER_ERROR");
    }
  },

  // updateRentalContract: async (
  //   id: bigint,
  //   input: Prisma.rental_contractsUpdateInput,
  // ): Promise<RentalContractWithDetails> => {
  //   try {
  //     return await rentalContractRepository.updateRentalContract(id, input);
  //   } catch (error) {
  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       // lỗi trung lặp
  //       if (error.code === "P2002") {
  //         throw new Error("RENTAL_CONTRACT_EXISTS");
  //       }

  //       // lỗi không tìm thấy hợp đồng cần update
  //       if (error.code === "P2025") {
  //         throw new Error("RENTAL_CONTRACT_NOT_FOUND");
  //       }
  //     }
  //     throw new Error("SERVER_ERROR");
  //   }
  // },


//   updateRentalContract: async (
//   id: bigint,
//   input: Prisma.rental_contractsUpdateInput,
//   transactionData?: Prisma.deposit_transactionsUncheckedCreateInput,
// ): Promise<RentalContractWithDetails> => {
//   try {
//     return await rentalContractRepository.updateRentalContract(
//       id,
//       input,
//       transactionData,
//     );
//   } catch (error) {
//     if (error instanceof Prisma.PrismaClientKnownRequestError) {
//       // Lỗi trùng lặp
//       if (error.code === "P2002") {
//         throw new Error("RENTAL_CONTRACT_EXISTS");
//       }

//       // Không tìm thấy hợp đồng hoặc bản ghi liên quan
//       if (error.code === "P2025") {
//         throw new Error("RENTAL_CONTRACT_NOT_FOUND");
//       }

//       // Lỗi khóa ngoại
//       if (error.code === "P2003") {
//         throw new Error("INVALID_RELATED_RECORD");
//       }
//     }

//     console.error("updateRentalContract error:", error);
//     throw new Error("SERVER_ERROR");
//   }
// },


updateRentalContract: async (
  id: bigint,
  newStatus: rental_contract_status,
): Promise<RentalContractWithDetails> => {
  try {
    // 1. Lấy thông tin hợp đồng hiện tại
    const contract = await rentalContractRepository.findById(id);

    if (!contract) {
      throw new Error("RENTAL_CONTRACT_NOT_FOUND");
    }

    const currentStatus = contract.status;

    // 2. Kiểm tra trạng thái không thay đổi
    if (currentStatus === newStatus) {
      throw new Error("RENTAL_CONTRACT_STATUS_UNCHANGED");
    }

    let depositData:
      | Prisma.contract_depositsUpdateInput
      | undefined;

    let transactionData:
      | Omit<
          Prisma.deposit_transactionsUncheckedCreateInput,
          "contract_deposit_id"
        >
      | undefined;

    // Lấy bản ghi tiền cọc
    const deposit = contract.contract_deposits[0];

    // 3. DRAFT -> ACTIVE: Ghi nhận thu tiền cọc
    if (
      currentStatus === "DRAFT" &&
      newStatus === "ACTIVE"
    ) {
      if (deposit && Number(deposit.initial_amount) > 0) {
        if (deposit.status !== "NOT_RECEIVED") {
          throw new Error("INVALID_DEPOSIT_STATUS");
        }

        depositData = {
          status: "RECEIVED",
          received_date: new Date(),
        };

        transactionData = {
          type: "COLLECT",
          amount: deposit.initial_amount,
          description: "Thu tiền đặt cọc hợp đồng",
        };
      }
    }

    // 4. ACTIVE -> COMPLETED / TERMINATED:
    // Chỉ kết thúc hợp đồng, không tự động quyết toán tiền cọc
    else if (
      currentStatus === "ACTIVE" &&
      (newStatus === "COMPLETED" ||
        newStatus === "TERMINATED")
    ) {
      // Không cập nhật khoản cọc tại đây.
      // Chờ chức năng quyết toán tiền cọc riêng.
    }

    // 5. Các trạng thái chuyển đổi không hợp lệ
    else {
      throw new Error("INVALID_RENTAL_CONTRACT_TRANSITION");
    }

    // 6. Cập nhật hợp đồng và tiền cọc
    return await rentalContractRepository.updateRentalContract(
      id,
      {
        status: newStatus,
      },
      depositData,
      transactionData,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "RENTAL_CONTRACT_NOT_FOUND",
        "RENTAL_CONTRACT_STATUS_UNCHANGED",
        "INVALID_RENTAL_CONTRACT_TRANSITION",
        "INVALID_DEPOSIT_STATUS",
        "CONTRACT_DEPOSIT_NOT_FOUND",
      ].includes(error.message)
    ) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new Error("RENTAL_CONTRACT_NOT_FOUND");
      }

      if (error.code === "P2003") {
        throw new Error("INVALID_RELATED_RECORD");
      }
    }

    console.error("updateRentalContract error:", error);
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
