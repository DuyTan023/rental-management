"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  House,
  Loader2,
  Users,
  Wallet,
} from "lucide-react";

type ContractStatus =
  | "DRAFT"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED"
  | "COMPLETED";

type ContractTenant = {
  id: string;
  role: string;
  status: string;
  joined_at: string;
  left_at: string | null;
  left_reason: string | null;
  profiles: {
    id: string;
    full_name: string;
    phone: string;
  };
};

type ContractRoom = {
  id: string;
  room_number: string;
  area: string | number;
  max_occupants: number;
  listed_rent: string | number;
  description: string | null;
};

type RentalContract = {
  id: string;
  room_id: string;
  contract_number: string;
  start_date: string;
  end_date: string | null;
  rent_price: string | number;
  billing_day: number;
  status: ContractStatus;
  termination_date: string | null;
  termination_reason: string | null;
  termination_requested_by: string | null;
  note: string | null;
  rooms: ContractRoom;
  contract_tenants: ContractTenant[];
};

type ContractDeposit = {
  id: string;
  initial_amount: string | number;
  status: string;
  received_date: string | null;
  refunded_amount: string | number;
  deducted_amount: string | number;
  deduction_reason: string | null;
  settled_date: string | null;
  note: string | null;
};

type DepositTransaction = {
  id: string;
  type: string;
  amount: string | number;
  transaction_date: string;
  description: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const contractStatusLabels: Record<ContractStatus, string> = {
  DRAFT: "Bản nháp",
  ACTIVE: "Đang hiệu lực",
  EXPIRED: "Đã hết hạn",
  TERMINATED: "Đã chấm dứt",
  COMPLETED: "Đã hoàn thành",
};

const contractStatusClasses: Record<ContractStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-gray-100 text-gray-700",
  TERMINATED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

const depositStatusLabels: Record<string, string> = {
  NOT_RECEIVED: "Chưa nhận cọc",
  RECEIVED: "Đã nhận cọc",
  REFUNDED: "Đã hoàn cọc",
  PARTIALLY_DEDUCTED: "Đã khấu trừ một phần",
  FULLY_DEDUCTED: "Đã khấu trừ toàn bộ",
  SETTLED: "Đã quyết toán",
};

const transactionTypeLabels: Record<string, string> = {
  COLLECT: "Thu tiền cọc",
  REFUND: "Hoàn tiền cọc",
  DEDUCT: "Khấu trừ tiền cọc",
  ADJUSTMENT: "Điều chỉnh",
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(value?: string | number | null) {
  if (value === undefined || value === null) return "—";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value));
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="font-semibold">{title}</h2>
      </div>

      {children}
    </section>
  );
}

export default function TenantContractDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const contractId = params.id;

  const [contract, setContract] = useState<RentalContract | null>(null);
  const [deposit, setDeposit] = useState<ContractDeposit | null>(null);
  const [transactions, setTransactions] = useState<DepositTransaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [depositLoading, setDepositLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  const fetchContract = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/landlord/rental_contracts/${contractId}`,
        {
          cache: "no-store",
          signal,
        }
      );

      const result: ApiResponse<RentalContract> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể tải thông tin hợp đồng."
        );
      }

      const data = (result.data as any)?.data ?? result.data;

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Dữ liệu hợp đồng không hợp lệ.");
      }

      setContract(data as RentalContract);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải hợp đồng."
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [contractId]);

  const fetchDeposit = useCallback(async (signal?: AbortSignal) => {
    try {
      setDepositLoading(true);
      setDepositError(null);

      const depositResponse = await fetch(
        `/api/landlord/rental_contracts/${contractId}/contract_deposit`,
        {
          cache: "no-store",
          signal,
        }
      );

      const depositResult: ApiResponse<ContractDeposit> =
        await depositResponse.json();

      if (!depositResponse.ok || !depositResult.success) {
        throw new Error(
          depositResult.message || "Không thể tải thông tin tiền cọc."
        );
      }

      const depositData = depositResult.data;
      setDeposit(depositData);

      const transactionResponse = await fetch(
        `/api/landlord/rental_contracts/${contractId}/contract_deposit/${depositData.id}/transactions?page=1&limit=100`,
        {
          cache: "no-store",
          signal,
        }
      );

      const transactionResult = await transactionResponse.json();

      if (!transactionResponse.ok || !transactionResult.success) {
        throw new Error(
          transactionResult.message ||
            "Không thể tải lịch sử giao dịch tiền cọc."
        );
      }

      const transactionData =
        transactionResult.data?.data ?? transactionResult.data;

      setTransactions(transactionData ?? []);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setDepositError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải thông tin tiền cọc."
      );
    } finally {
      if (!signal?.aborted) setDepositLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    const controller = new AbortController();

    void fetchContract(controller.signal);
    void fetchDeposit(controller.signal);

    return () => controller.abort();
  }, [fetchContract, fetchDeposit]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Đang tải thông tin hợp đồng...
        </p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Link
          href="/tenant/contracts"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách hợp đồng
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
          {error ?? "Không tìm thấy hợp đồng."}
        </div>
      </div>
    );
  }

  const status = contract.status;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-5">
        <div>
          <button
            type="button"
            onClick={() => router.push("/tenant/contracts")}
            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Danh sách hợp đồng
          </button>

          <h1 className="text-2xl font-bold">
            Chi tiết hợp đồng
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {contract.contract_number}
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1.5 text-sm font-medium ${
            contractStatusClasses[status]
          }`}
        >
          {contractStatusLabels[status]}
        </span>
      </div>

      {/* CONTRACT INFORMATION */}
      <Section
        title="Thông tin hợp đồng"
        icon={<FileText className="h-5 w-5" />}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label="Mã hợp đồng"
            value={contract.contract_number}
          />

          <InfoItem
            label="Giá thuê theo hợp đồng"
            value={formatCurrency(contract.rent_price)}
          />

          <InfoItem
            label="Ngày bắt đầu"
            value={formatDate(contract.start_date)}
          />

          <InfoItem
            label="Ngày kết thúc"
            value={formatDate(contract.end_date)}
          />

          <InfoItem
            label="Ngày thanh toán hàng tháng"
            value={`Ngày ${contract.billing_day}`}
          />

          <InfoItem
            label="Trạng thái"
            value={contractStatusLabels[status]}
          />
        </div>

        {contract.note && (
          <div className="mt-5 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Ghi chú hợp đồng
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">
              {contract.note}
            </p>
          </div>
        )}

        {status === "TERMINATED" && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-700">
              Thông tin chấm dứt hợp đồng
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <InfoItem
                label="Ngày chấm dứt"
                value={formatDate(contract.termination_date)}
              />

              <InfoItem
                label="Bên yêu cầu"
                value={contract.termination_requested_by ?? "—"}
              />
            </div>

            {contract.termination_reason && (
              <p className="mt-3 text-sm text-red-700">
                Lý do: {contract.termination_reason}
              </p>
            )}
          </div>
        )}
      </Section>

      {/* ROOM INFORMATION */}
      <Section
        title="Thông tin phòng thuê"
        icon={<House className="h-5 w-5" />}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label="Số phòng"
            value={contract.rooms?.room_number}
          />

          <InfoItem
            label="Diện tích"
            value={
              contract.rooms?.area != null
                ? `${contract.rooms.area} m²`
                : "—"
            }
          />

          <InfoItem
            label="Số người tối đa"
            value={contract.rooms?.max_occupants}
          />

          <InfoItem
            label="Giá niêm yết hiện tại"
            value={formatCurrency(contract.rooms?.listed_rent)}
          />
        </div>

        {contract.rooms?.description && (
          <div className="mt-5 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Mô tả phòng
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">
              {contract.rooms.description}
            </p>
          </div>
        )}
      </Section>

      {/* TENANTS */}
      <Section
        title="Danh sách người thuê trong hợp đồng"
        icon={<Users className="h-5 w-5" />}
      >
        {contract.contract_tenants?.length ? (
          <div className="divide-y">
            {contract.contract_tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {tenant.profiles?.full_name ?? "Người thuê"}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {tenant.profiles?.phone ?? "Chưa có số điện thoại"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
                    {tenant.role === "REPRESENTATIVE"
                      ? "Người đại diện"
                      : "Thành viên"}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 ${
                      tenant.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {tenant.status === "ACTIVE"
                      ? "Đang tham gia"
                      : "Đã rời hợp đồng"}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground sm:text-right">
                  <p>Tham gia: {formatDate(tenant.joined_at)}</p>
                  {tenant.left_at && (
                    <p>Rời đi: {formatDate(tenant.left_at)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Chưa có thông tin người thuê.
          </p>
        )}
      </Section>

      {/* DEPOSIT */}
      <Section
        title="Thông tin tiền đặt cọc"
        icon={<Wallet className="h-5 w-5" />}
      >
        {depositLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải thông tin tiền cọc...
          </div>
        ) : depositError ? (
          <p className="text-sm text-red-600">{depositError}</p>
        ) : deposit ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem
                label="Số tiền cọc ban đầu"
                value={formatCurrency(deposit.initial_amount)}
              />

              <InfoItem
                label="Trạng thái tiền cọc"
                value={
                  depositStatusLabels[deposit.status] ?? deposit.status
                }
              />

              <InfoItem
                label="Ngày nhận cọc"
                value={formatDate(deposit.received_date)}
              />

              <InfoItem
                label="Số tiền đã hoàn"
                value={formatCurrency(deposit.refunded_amount)}
              />

              <InfoItem
                label="Số tiền đã khấu trừ"
                value={formatCurrency(deposit.deducted_amount)}
              />

              <InfoItem
                label="Ngày quyết toán"
                value={formatDate(deposit.settled_date)}
              />
            </div>

            {deposit.deduction_reason && (
              <div className="mt-4 border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Lý do khấu trừ
                </p>
                <p className="mt-1 text-sm">
                  {deposit.deduction_reason}
                </p>
              </div>
            )}

            {deposit.note && (
              <div className="mt-4 border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Ghi chú
                </p>
                <p className="mt-1 text-sm">{deposit.note}</p>
              </div>
            )}

            {/* DEPOSIT TRANSACTIONS */}
            <div className="mt-6 border-t pt-5">
              <h3 className="mb-4 font-semibold">
                Lịch sử giao dịch tiền cọc
              </h3>

              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có giao dịch tiền cọc.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[550px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">
                          Ngày giao dịch
                        </th>
                        <th className="pb-3 pr-4 font-medium">
                          Loại giao dịch
                        </th>
                        <th className="pb-3 pr-4 text-right font-medium">
                          Số tiền
                        </th>
                        <th className="pb-3 font-medium">
                          Nội dung
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b last:border-0"
                        >
                          <td className="py-3 pr-4">
                            {formatDate(transaction.transaction_date)}
                          </td>

                          <td className="py-3 pr-4">
                            {transactionTypeLabels[transaction.type] ??
                              transaction.type}
                          </td>

                          <td className="py-3 pr-4 text-right font-medium">
                            {formatCurrency(transaction.amount)}
                          </td>

                          <td className="py-3">
                            {transaction.description ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Hợp đồng chưa có thông tin tiền đặt cọc.
          </p>
        )}
      </Section>
    </div>
  );
}