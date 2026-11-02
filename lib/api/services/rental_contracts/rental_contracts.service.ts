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

updateRentalContract: async (
  id: bigint,
  newStatus: rental_contract_status,
): Promise<RentalContractWithDetails> => {
  try {
    // 1. Lấy hợp đồng hiện tại cùng tiền cọc và lịch sử giao dịch.
    const contract = await rentalContractRepository.findById(id);

    if (!contract) {
      throw new Error("RENTAL_CONTRACT_NOT_FOUND");
    }

    const currentStatus = contract.status;

    if (currentStatus === newStatus) {
      throw new Error("RENTAL_CONTRACT_STATUS_UNCHANGED");
    }

    // 2. Chỉ cho phép các chuyển trạng thái được quy định.
    const activating =
      currentStatus === "DRAFT" && newStatus === "ACTIVE";

    const terminating =
      currentStatus === "ACTIVE" &&
      (newStatus === "COMPLETED" ||
        newStatus === "TERMINATED");

    if (!activating && !terminating) {
      throw new Error("INVALID_RENTAL_CONTRACT_TRANSITION");
    }

    const deposit = contract.contract_deposits[0];

    let depositData:
      | Prisma.contract_depositsUpdateInput
      | undefined;

    let transactionData:
      | Omit<
          Prisma.deposit_transactionsUncheckedCreateInput,
          "contract_deposit_id"
        >
      | undefined;

    // 3. DRAFT -> ACTIVE: ghi nhận thu tiền cọc.
    if (activating) {
      if (deposit && deposit.initial_amount.gt(0)) {
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
    // Quyết toán dựa trên lịch sử giao dịch tiền cọc.
    if (terminating && deposit) {
      const transactions = deposit.deposit_transactions;

      const zero = new Prisma.Decimal(0);

      let collected = zero;
      let refunded = zero;
      let deducted = zero;
      let adjustments = zero;

      for (const transaction of transactions) {
        const amount = new Prisma.Decimal(transaction.amount);

        switch (transaction.type) {
          case "COLLECT":
            collected = collected.plus(amount);
            break;

          case "REFUND":
            refunded = refunded.plus(amount);
            break;

          case "DEDUCT":
            deducted = deducted.plus(amount);
            break;

          case "ADJUSTMENT":
            // Quy ước: số dương tăng cọc, số âm giảm cọc.
            adjustments = adjustments.plus(amount);
            break;
        }
      }

      // Không quyết toán một khoản cọc chưa từng được thu.
      if (
        deposit.status === "NOT_RECEIVED" &&
        deposit.initial_amount.gt(0)
      ) {
        throw new Error("INVALID_DEPOSIT_STATUS");
      }

      // Tổng số tiền thực tế còn lại.
      const balance = collected
        .minus(refunded)
        .minus(deducted)
        .plus(adjustments);

      if (balance.lt(0)) {
        throw new Error("INVALID_DEPOSIT_BALANCE");
      }

      // Kiểm tra tính hợp lệ của lịch sử trước khi quyết toán.
      if (
        refunded.gt(collected.plus(adjustments)) ||
        deducted.gt(collected.plus(adjustments))
      ) {
        throw new Error("INVALID_DEPOSIT_BALANCE");
      }

      // Không cho phép xử lý lại khoản cọc đã quyết toán.
      if (
        ["REFUNDED", "FULLY_DEDUCTED", "SETTLED"].includes(
          deposit.status,
        )
      ) {
        if (!balance.isZero()) {
          throw new Error("INVALID_DEPOSIT_STATUS");
        }

        throw new Error("DEPOSIT_ALREADY_SETTLED");
      }

      // Số dư dương: hoàn lại toàn bộ số dư còn lại.
      if (balance.gt(0)) {
        transactionData = {
          type: "REFUND",
          amount: balance,
          description: "Hoàn tiền cọc khi kết thúc hợp đồng",
        };
      }

      // Cập nhật số liệu tổng hợp từ lịch sử giao dịch.
      const totalRefunded = refunded.plus(balance);
      const totalDeducted = deducted;

      let finalDepositStatus:
        | "REFUNDED"
        | "PARTIALLY_DEDUCTED"
        | "FULLY_DEDUCTED"
        | "SETTLED";

      if (totalDeducted.gt(0) && balance.gt(0)) {
        finalDepositStatus = "PARTIALLY_DEDUCTED";
      } else if (totalDeducted.gt(0)) {
        finalDepositStatus = "FULLY_DEDUCTED";
      } else if (balance.gt(0)) {
        finalDepositStatus = "REFUNDED";
      } else {
        finalDepositStatus = "SETTLED";
      }

      depositData = {
        refunded_amount: totalRefunded,
        deducted_amount: totalDeducted,
        status: finalDepositStatus,
        settled_date: new Date(),
      };
    }

    // 5. Cập nhật hợp đồng, tiền cọc và giao dịch.
    // Repository sẽ thực hiện các thao tác ghi trong transaction.
    return await rentalContractRepository.updateRentalContract(
      id,
      { status: newStatus },
      depositData,
      transactionData,
    );
  } catch (error) {
    if (error instanceof Error) {
      const knownErrors = [
        "RENTAL_CONTRACT_NOT_FOUND",
        "RENTAL_CONTRACT_STATUS_UNCHANGED",
        "INVALID_RENTAL_CONTRACT_TRANSITION",
        "INVALID_DEPOSIT_STATUS",
        "INVALID_DEPOSIT_BALANCE",
        "DEPOSIT_ALREADY_SETTLED",
        "CONTRACT_DEPOSIT_NOT_FOUND",
      ];

      if (knownErrors.includes(error.message)) {
        throw error;
      }
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
