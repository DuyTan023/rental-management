
"use client";

import { Loader2, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FormDeductDeposit from "../FormDeductDeposit";

;

// ======================================================
// TYPES
// ======================================================

export type ContractDeposit = {
  id: string;
  contract_id: string;
  initial_amount: string;
  status: string;
  received_date: string | null;
  refunded_amount: string;
  deducted_amount: string;
  deduction_reason: string | null;
  settled_date: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type DepositTransaction = {
  id: string;
  contract_deposit_id: string;
  type: string;
  amount: string;
  transaction_date: string;
  description: string | null;
  created_by: string;
  created_at: string;
};

export type DepositTransactionResponse = {
  data: DepositTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
};

type Props = {
  contractId: string;
  deposit: ContractDeposit | null;
  depositTransactions: DepositTransaction[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
};

// ======================================================
// CONFIG
// ======================================================

const DEPOSIT_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  NOT_RECEIVED: {
    label: "Chưa thu tiền",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  RECEIVED: {
    label: "Đã thu tiền",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  REFUNDED: {
    label: "Đã hoàn cọc",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  PARTIALLY_DEDUCTED: {
    label: "Đã khấu trừ một phần",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  FULLY_DEDUCTED: {
    label: "Đã khấu trừ toàn bộ",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  SETTLED: {
    label: "Đã quyết toán",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
};

const TRANSACTION_CONFIG: Record<
  string,
  { label: string; className: string; sign: string }
> = {
  COLLECT: {
    label: "Thu tiền cọc",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    sign: "+",
  },
  REFUND: {
    label: "Hoàn tiền cọc",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    sign: "-",
  },
  DEDUCT: {
    label: "Khấu trừ tiền cọc",
    className: "border-orange-200 bg-orange-50 text-orange-700",
    sign: "-",
  },
  ADJUSTMENT: {
    label: "Điều chỉnh tiền cọc",
    className: "border-violet-200 bg-violet-50 text-violet-700",
    sign: "",
  },
};

// ======================================================
// HELPERS
// ======================================================

const formatCurrency = (value: number | string | null | undefined) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return "—";

  const dateString =
    typeof value === "string" ? value : value.toISOString();

  const dateOnly = dateString.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

  if (dateOnly) {
    const [year, month, day] = dateOnly.split("-");
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

// ======================================================
// COMPONENT
// ======================================================

export default function ContractDeposit({
  contractId,
  deposit,
  depositTransactions,
  loading,
  error,
  onRefresh,
}: Props) {
  const depositInitial = Number(deposit?.initial_amount ?? 0);
  const depositRefunded = Number(deposit?.refunded_amount ?? 0);
  const depositDeducted = Number(deposit?.deducted_amount ?? 0);

  // Số dư = Tiền cọc ban đầu - Tiền đã hoàn - Tiền đã khấu trừ.
  const depositBalance = Math.max(
    0,
    depositInitial - depositRefunded - depositDeducted
  );

  const depositStatus = deposit?.status
    ? DEPOSIT_STATUS_CONFIG[deposit.status] ?? {
        label: deposit.status,
        className: "border-slate-200 bg-slate-100 text-slate-700",
      }
    : null;

  const canDeduct =
    deposit !== null &&
    ["RECEIVED", "PARTIALLY_DEDUCTED"].includes(deposit.status) &&
    depositBalance > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">
              Quản lý tiền cọc
            </CardTitle>
            <CardDescription>
              Theo dõi khoản cọc và các giao dịch phát sinh
            </CardDescription>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void onRefresh()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Làm mới
            </Button>

            {canDeduct && deposit && (
              <FormDeductDeposit
                id={contractId}
                depositId={deposit.id}
                initialAmount={depositInitial}
                deductedAmount={depositDeducted}
                refundedAmount={depositRefunded}
                onSuccess={() => {
                  void onRefresh();
                }}
              />
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-6 pt-6">
        {/* Loading lần đầu */}
        {loading && !deposit ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải thông tin tiền cọc...
          </div>
        ) : error && !deposit ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : !deposit ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="font-medium">
              Chưa có thông tin khoản cọc
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Hợp đồng chưa có khoản tiền cọc được ghi nhận.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Trạng thái tiền cọc */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Trạng thái khoản cọc
                </p>
                <div className="mt-2">
                  {depositStatus && (
                    <Badge
                      variant="outline"
                      className={depositStatus.className}
                    >
                      {depositStatus.label}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-sm text-muted-foreground">
                  Ngày nhận cọc
                </p>
                <p className="mt-1 font-semibold">
                  {formatDate(deposit.received_date)}
                </p>
              </div>
            </div>

            {/* Tổng quan tiền cọc */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">
                  Tiền cọc ban đầu
                </p>
                <p className="mt-3 text-xl font-bold">
                  {formatCurrency(deposit.initial_amount)}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">
                  Số dư cọc
                </p>
                <p className="mt-3 text-xl font-bold text-emerald-600">
                  {formatCurrency(depositBalance)}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">
                  Đã hoàn trả
                </p>
                <p className="mt-3 text-xl font-bold text-blue-600">
                  {formatCurrency(deposit.refunded_amount)}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">
                  Đã khấu trừ
                </p>
                <p className="mt-3 text-xl font-bold text-orange-600">
                  {formatCurrency(deposit.deducted_amount)}
                </p>
              </div>
            </div>

            {/* Lý do khấu trừ */}
            {deposit.deduction_reason && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm font-semibold text-orange-800">
                  Lý do khấu trừ
                </p>
                <p className="mt-1 text-sm text-orange-700">
                  {deposit.deduction_reason}
                </p>
              </div>
            )}

            {/* Ghi chú */}
            {deposit.note && (
              <div className="rounded-lg bg-muted/40 p-4">
                <p className="text-sm font-medium">
                  Ghi chú khoản cọc
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {deposit.note}
                </p>
              </div>
            )}

            <Separator />

            {/* Lịch sử giao dịch */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">
                    Lịch sử giao dịch tiền cọc
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Các khoản thu, hoàn trả và khấu trừ được ghi nhận
                  </p>
                </div>

                <Badge variant="secondary">
                  {depositTransactions.length} giao dịch
                </Badge>
              </div>

              {loading && depositTransactions.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải lịch sử giao dịch...
                </div>
              ) : depositTransactions.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <p className="font-medium">
                    Chưa có giao dịch tiền cọc
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Lịch sử giao dịch sẽ hiển thị tại đây khi có phát sinh.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-5">STT</TableHead>
                        <TableHead>Loại giao dịch</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Ngày giao dịch</TableHead>
                        <TableHead>Mô tả</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {depositTransactions.map((transaction, index) => {
                        const config =
                          TRANSACTION_CONFIG[transaction.type] ?? {
                            label: transaction.type,
                            className:
                              "border-slate-200 bg-slate-100 text-slate-700",
                            sign: "",
                          };

                        const amountClass =
                          transaction.type === "COLLECT"
                            ? "text-emerald-600"
                            : transaction.type === "REFUND" ||
                                transaction.type === "DEDUCT"
                              ? "text-orange-600"
                              : "";

                        return (
                          <TableRow key={transaction.id}>
                            <TableCell className="pl-5">
                              {index + 1}
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant="outline"
                                className={config.className}
                              >
                                {config.label}
                              </Badge>
                            </TableCell>

                            <TableCell className="font-semibold">
                              <span className={amountClass}>
                                {config.sign}
                                {formatCurrency(transaction.amount)}
                              </span>
                            </TableCell>

                            <TableCell>
                              {formatDate(transaction.transaction_date)}
                            </TableCell>

                            <TableCell className="max-w-[240px]">
                              <span className="line-clamp-2 text-sm text-muted-foreground">
                                {transaction.description || "—"}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
