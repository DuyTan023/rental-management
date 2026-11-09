"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  House,
  Image as ImageIcon,
  RefreshCw,
  Wallet,
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
  amount: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_ref: string | null;
  payment_date: string | null;
  proof_image_url: string | null;
  rejection_reason: string | null;
  note: string | null;
  created_at: string;
  invoice: {
    invoice_number: string;
    billing_month: number;
    billing_year: number;
  };
};

type PaymentHistoryResponse = {
  success: boolean;
  message?: string;
  data: {
    payments: Payment[];
    summary: {
      total_paid: string;
      total_pending: string;
      total_transactions: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
};

const formatMoney = (value: string | number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value));
};

const formatDate = (value: string | null) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Chờ xác nhận",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  PAYOS: "PayOS",
};

const statusStyles: Record<PaymentStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  SUCCESS: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
  REFUNDED: "bg-blue-100 text-blue-700",
};

export default function TenantPaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState({
    total_paid: "0",
    total_pending: "0",
    total_transactions: 0,
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPaymentHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (status) params.set("status", status);
      if (paymentMethod) {
        params.set("payment_method", paymentMethod);
      }

      const response = await fetch(
        `/api/tenant/payment-history?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result: PaymentHistoryResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể tải lịch sử thanh toán."
        );
      }

      setPayments(result.data.payments);
      setSummary(result.data.summary);
      setTotalPages(result.data.pagination.total_pages || 1);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi tải dữ liệu."
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, paymentMethod]);

  useEffect(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleMethodChange = (value: string) => {
    setPaymentMethod(value);
    setPage(1);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="mt-5">
             <div className="flex items-center gap-2 text-sm text-slate-500">
                    <House size={16} />
                    <Link href = "/tenant/dashboard" className="hover:underline hover:text-blue-600"><span>Xóm Cũ</span></Link>
                    <ChevronRight size={14} />
                  <span className="text-blue-600">Lịch sử thanh toán</span>
                </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Lịch sử thanh toán
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi các giao dịch thanh toán hóa đơn phòng của bạn.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPaymentHistory}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Làm mới
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Tổng tiền đã thanh toán"
          value={formatMoney(summary.total_paid)}
          icon={<Wallet size={20} />}
          iconClass="bg-green-100 text-green-600"
        />

        <SummaryCard
          title="Đang chờ xác nhận"
          value={formatMoney(summary.total_pending)}
          icon={<Clock3 size={20} />}
          iconClass="bg-yellow-100 text-yellow-600"
        />

        <SummaryCard
          title="Tổng số giao dịch"
          value={String(summary.total_transactions)}
          icon={<CreditCard size={20} />}
          iconClass="bg-blue-100 text-blue-600"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium">
            Trạng thái
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="SUCCESS">Thành công</option>
            <option value="FAILED">Thất bại</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="REFUNDED">Đã hoàn tiền</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium">
            Phương thức thanh toán
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => handleMethodChange(e.target.value)}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tất cả phương thức</option>
            <option value="CASH">Tiền mặt</option>
            <option value="BANK_TRANSFER">Chuyển khoản</option>
            <option value="PAYOS">PayOS</option>
          </select>
        </div>
      </div>

      {/* Payment list */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-4 py-4">
          <h2 className="font-semibold">Danh sách giao dịch</h2>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={fetchPaymentHistory}
              className="mt-3 text-sm font-medium text-primary hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-3 rounded-full bg-muted p-4">
              <Wallet size={28} className="text-muted-foreground" />
            </div>
            <p className="font-medium">Chưa có giao dịch thanh toán</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Lịch sử thanh toán của bạn sẽ được hiển thị tại đây.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Mã giao dịch</th>
                    <th className="px-4 py-3 font-medium">Hóa đơn</th>
                    <th className="px-4 py-3 font-medium">Số tiền</th>
                    <th className="px-4 py-3 font-medium">Phương thức</th>
                    <th className="px-4 py-3 font-medium">Ngày thanh toán</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Chi tiết
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-muted/30">
                      <td className="px-4 py-4 font-medium">
                        {payment.transaction_ref || `#${payment.id}`}
                      </td>

                      <td className="px-4 py-4">
                        <Link
                          href={`/tenant/invoices`}
                          className="font-medium text-primary hover:underline"
                        >
                          {payment.invoice?.invoice_number || "—"}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Tháng {payment.invoice?.billing_month}/
                          {payment.invoice?.billing_year}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-semibold">
                        {formatMoney(payment.amount)}
                      </td>

                      <td className="px-4 py-4">
                        {paymentMethodLabels[payment.payment_method] ||
                          payment.payment_method}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                        {formatDate(payment.payment_date)}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={payment.status} />
                      </td>

                      <td className="px-4 py-4 text-right">
                        <a
                          href={
                            payment.proof_image_url ||
                            `/tenant/invoices`
                          }
                          target={
                            payment.proof_image_url ? "_blank" : undefined
                          }
                          rel={
                            payment.proof_image_url
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          {payment.proof_image_url ? (
                            <>
                              <ImageIcon size={15} />
                              Xem ảnh
                            </>
                          ) : (
                            <>
                              <FileText size={15} />
                              Xem
                            </>
                          )}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {payments.map((payment) => (
                <div key={payment.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {payment.invoice?.invoice_number || "Giao dịch"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {payment.transaction_ref || `Mã #${payment.id}`}
                      </p>
                    </div>
                    <StatusBadge status={payment.status} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Số tiền
                    </span>
                    <span className="font-semibold">
                      {formatMoney(payment.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Phương thức
                    </span>
                    <span>
                      {paymentMethodLabels[payment.payment_method]}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Ngày thanh toán
                    </span>
                    <span>{formatDate(payment.payment_date)}</span>
                  </div>

                  {payment.proof_image_url && (
                    <a
                      href={payment.proof_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ImageIcon size={16} />
                      Xem ảnh minh chứng
                    </a>
                  )}

                  {payment.rejection_reason && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      <p className="font-medium">Lý do từ chối</p>
                      <p className="mt-1">{payment.rejection_reason}</p>
                    </div>
                  )}

                  {payment.note && (
                    <p className="text-sm text-muted-foreground">
                      Ghi chú: {payment.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && !error && payments.length > 0 && (
          <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {page} / {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Trước
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sau
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className={`rounded-lg p-2 ${iconClass}`}>{icon}</div>
      </div>
      <p className="mt-3 text-xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        statusStyles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {paymentStatusLabels[status] || status}
    </span>
  );
}