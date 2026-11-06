"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  FileText,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  User,
} from "lucide-react";

type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

type PaymentMethod = "CASH" | "BANK_TRANSFER" | "PAYOS";

type Payment = {
  id: string;
  invoice_id: string;
  payer: {
    id: string;
    full_name: string;
    phone: string;
  } | null;
  created_by: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  amount: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_ref: string | null;
  payos_order_code: string | null;
  payment_date: string | null;
  note: string | null;
  created_at: string;
};

type PaymentHistoryData = {
  invoice: {
    id: string;
    invoice_number: string;
    total_amount: string;
    paid_amount: string;
    remaining_amount: string;
    status: string;
  };
  summary: {
    successful_payment_count: number;
    successful_payment_amount: string;
  };
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "SUCCESS", label: "Thành công" },
  { value: "PENDING", label: "Đang chờ" },
  { value: "FAILED", label: "Thất bại" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "REFUNDED", label: "Đã hoàn tiền" },
];

const STATUS_LABELS: Record<PaymentStatus, string> = {
  SUCCESS: "Thành công",
  PENDING: "Đang chờ",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  PAYOS: "PayOS",
};

function formatMoney(value: string | number) {
  return `${Number(value).toLocaleString("vi-VN")} đ`;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<PaymentStatus, string> = {
    SUCCESS: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-600",
    REFUNDED: "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

type Props = {
  invoiceId: string;
};

export default function InvoicePaymentHistory({ invoiceId }: Props) {
  const [data, setData] = useState<PaymentHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (status) {
        params.set("status", status);
      }

      const response = await fetch(
        `/api/landlord/invoices/${invoiceId}/payments?${params.toString()}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể tải lịch sử thanh toán."
        );
      }

      setData(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải lịch sử thanh toán."
      );
    } finally {
      setLoading(false);
    }
  }, [invoiceId, page, status]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <section className="space-y-5 rounded-xl border bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <CreditCard className="h-5 w-5" />
            Lịch sử thanh toán
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Danh sách các giao dịch của hóa đơn.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPayments}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Làm mới
        </button>
      </div>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              Tổng giao dịch thành công
            </p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {data.summary.successful_payment_count}
            </p>
          </div>

          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-700">
              Đã thanh toán
            </p>
            <p className="mt-1 text-xl font-semibold text-green-700">
              {formatMoney(data.summary.successful_payment_amount)}
            </p>
          </div>

          <div className="rounded-lg bg-orange-50 p-4">
            <p className="text-sm text-orange-700">
              Còn phải thanh toán
            </p>
            <p className="mt-1 text-xl font-semibold text-orange-700">
              {formatMoney(data.invoice.remaining_amount)}
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label
            htmlFor="payment-status"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Trạng thái giao dịch
          </label>

          <select
            id="payment-status"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 sm:w-56"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-gray-500">
          {data?.pagination.totalItems ?? 0} giao dịch
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={fetchPayments}
            className="ml-2 font-semibold underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải lịch sử thanh toán...
        </div>
      )}

      {/* Empty */}
      {!loading && !error && data?.payments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <CreditCard className="mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-700">
            Chưa có giao dịch thanh toán
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Các khoản thanh toán của hóa đơn sẽ hiển thị tại đây.
          </p>
        </div>
      )}

      {/* Payment list */}
      {!loading && !error && data && data.payments.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Người thanh toán</th>
                  <th className="px-4 py-3 font-medium">Số tiền</th>
                  <th className="px-4 py-3 font-medium">Phương thức</th>
                  <th className="px-4 py-3 font-medium">Thời gian</th>
                  <th className="px-4 py-3 font-medium">Người ghi nhận</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {data.payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {payment.payer?.full_name ?? "Không xác định"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {payment.payer?.phone ?? "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatMoney(payment.amount)}
                    </td>

                    <td className="px-4 py-3">
                      {METHOD_LABELS[payment.payment_method]}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(payment.payment_date)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>
                          {payment.created_by?.full_name ??
                            payment.created_by?.email ??
                            "Hệ thống"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={payment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Trang {data.pagination.page} /{" "}
              {Math.max(data.pagination.totalPages, 1)}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!data.pagination.hasPreviousPage || loading}
                onClick={() => setPage((prev) => prev - 1)}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </button>

              <button
                type="button"
                disabled={!data.pagination.hasNextPage || loading}
                onClick={() => setPage((prev) => prev + 1)}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}