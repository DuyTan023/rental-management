
"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import type {
  RentalContractWithDetails,
} from "@/lib/api/repositories/rental_contracts/rental_contracts.repository";

import ContractInfo from "./ContractInfo";
import ContractRoomInfo from "./ContractRoomInfo";

import ContractDeposit, {
  type ContractDeposit as ContractDepositType,
  type DepositTransaction,
  type DepositTransactionResponse,
} from "./ContractDeposit";
import { ContractTenants } from "./ContractTenants";

type ContractStatus =
  | "DRAFT"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED"
  | "COMPLETED";

type ContractDetailProps = {
  contractId: string;
};

export function ContractDetail({
  contractId,
}: ContractDetailProps) {
  const [contract, setContract] =
    useState<RentalContractWithDetails | null>(null);

  const [deposit, setDeposit] =
    useState<ContractDepositType | null>(null);

  const [depositTransactions, setDepositTransactions] =
    useState<DepositTransaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingDeposit, setLoadingDeposit] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // ======================================================
  // FETCH CONTRACT
  // ======================================================

  const fetchContract = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/landlord/rental_contracts/${contractId}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể lấy thông tin hợp đồng."
        );
      }

      const data = result.data?.data ?? result.data;

      if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
      ) {
        throw new Error("Dữ liệu hợp đồng không hợp lệ.");
      }

      setContract(data as RentalContractWithDetails);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi lấy thông tin hợp đồng."
      );
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  // ======================================================
  // FETCH DEPOSIT + TRANSACTIONS
  // ======================================================

  const fetchDeposit = useCallback(async () => {
    try {
      setLoadingDeposit(true);
      setDepositError(null);

      const depositResponse = await fetch(
        `/api/landlord/rental_contracts/${contractId}/contract_deposit`,
        { cache: "no-store" }
      );

      const depositResult = await depositResponse.json();

      if (!depositResponse.ok || !depositResult.success) {
        throw new Error(
          depositResult.message || "Không thể lấy thông tin khoản cọc."
        );
      }

      const depositData: ContractDepositType = depositResult.data;

      setDeposit(depositData);

      const transactionResponse = await fetch(
        `/api/landlord/rental_contracts/${contractId}/contract_deposit/${depositData.id}/transactions?page=1&limit=100`,
        { cache: "no-store" }
      );

      const transactionResult = await transactionResponse.json();

      if (!transactionResponse.ok || !transactionResult.success) {
        throw new Error(
          transactionResult.message ||
            "Không thể lấy lịch sử giao dịch tiền cọc."
        );
      }

      const transactionData: DepositTransactionResponse =
        transactionResult.data;

      setDepositTransactions(transactionData.data ?? []);
    } catch (err) {
      setDepositError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi lấy thông tin tiền cọc."
      );
    } finally {
      setLoadingDeposit(false);
    }
  }, [contractId]);

  useEffect(() => {
    void fetchContract();
    void fetchDeposit();
  }, [fetchContract, fetchDeposit]);

  // ======================================================
  // UPDATE CONTRACT STATUS + ROOM STATUS
  // ======================================================

  const handleUpdateStatus = async (newStatus: ContractStatus) => {
    if (!contract) {
      throw new Error("Không tìm thấy thông tin hợp đồng.");
    }

    if (newStatus === contract.status) {
      throw new Error("Trạng thái mới phải khác trạng thái hiện tại.");
    }

    const previousStatus = contract.status;

    let roomStatus: "AVAILABLE" | "OCCUPIED" | null = null;

    if (previousStatus === "ACTIVE" && newStatus !== "ACTIVE") {
      roomStatus = "AVAILABLE";
    } else if (
      previousStatus !== "ACTIVE" &&
      newStatus === "ACTIVE"
    ) {
      roomStatus = "OCCUPIED";
    }

    setStatusMessage(null);

    try {
      // Bước 1: Cập nhật trạng thái hợp đồng.
      const response = await fetch(
        `/api/landlord/rental_contracts/${contractId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể cập nhật trạng thái hợp đồng."
        );
      }

      const updatedContract = result.data?.data ?? result.data;

      if (
        updatedContract &&
        typeof updatedContract === "object" &&
        !Array.isArray(updatedContract) &&
        "contract_number" in updatedContract
      ) {
        setContract(updatedContract as RentalContractWithDetails);
      } else {
        setContract((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus as RentalContractWithDetails["status"],
              }
            : prev
        );
      }

      // Bước 2: Đồng bộ trạng thái phòng.
      if (roomStatus !== null) {
        const roomResponse = await fetch(
          `/api/landlord/rooms/${contract.room_id.toString()}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: roomStatus,
            }),
          }
        );

        const roomResult = await roomResponse.json();

        if (!roomResponse.ok || !roomResult.success) {
          throw new Error(
            roomResult.message ||
              "Hợp đồng đã cập nhật nhưng trạng thái phòng chưa được đồng bộ."
          );
        }
      }

      // Bước 3: Tải lại dữ liệu mới nhất.
      await Promise.all([
        fetchContract(),
        fetchDeposit(),
      ]);

      setStatusMessage(
        roomStatus !== null
          ? "Cập nhật trạng thái hợp đồng và phòng thành công!"
          : "Cập nhật trạng thái hợp đồng thành công!"
      );
    } catch (err) {
      // Đồng bộ lại dữ liệu nếu một bước trong quy trình thất bại.
      await Promise.all([
        fetchContract(),
        fetchDeposit(),
      ]);

      throw err;
    }
  };

  // ======================================================
  // LOADING / ERROR
  // ======================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Đang tải thông tin hợp đồng...
          </p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        {error ?? "Không tìm thấy hợp đồng."}
      </div>
    );
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <ContractInfo
        contract={contract}
        statusMessage={statusMessage}
        onUpdateStatus={handleUpdateStatus}
      />

      <ContractRoomInfo contract={contract} />

      <ContractTenants
          contractId={contractId}
          tenants={contract.contract_tenants ?? []}
          maxOccupants={contract.rooms.max_occupants}
          onRefresh={fetchContract}
        />

      <ContractDeposit
        contractId={contractId}
        deposit={deposit}
        depositTransactions={depositTransactions}
        loading={loadingDeposit}
        error={depositError}
        onRefresh={fetchDeposit}
      />
    </div>
  );
}

export default ContractDetail;
