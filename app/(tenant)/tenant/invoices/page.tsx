"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  House,
  Loader2,
  Receipt,
  Wallet,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

type InvoiceStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: string | number;
  unit_price: string | number;
  subtotal: string | number;

  services?: {
    name: string;
    unit: string;
  } | null;

  meter_readings?: {
    old_value: string | number;
    new_value: string | number;
    consumption: string | number | null;
  } | null;
};

type Invoice = {
  id: string;
  invoice_number: string;
  billing_month: number;
  billing_year: number;
  issue_date: string;
  due_date: string;
  total_amount: string | number;
  paid_amount: string | number;
  status: InvoiceStatus;
  note: string | null;

  rental_contracts: {
    contract_number: string;
    rooms: {
      room_number: string;
    };
  };

  invoice_items: InvoiceItem[];
};

type Pagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type InvoiceListResponse = {
  invoices: Invoice[];
  pagination: Pagination;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "UNPAID", label: "Chưa thanh toán" },
  { value: "PARTIALLY_PAID", label: "Thanh toán một phần" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "OVERDUE", label: "Quá hạn" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  UNPAID: {
    label: "Chưa thanh toán",
    className: "bg-amber-100 text-amber-700",
  },
  PARTIALLY_PAID: {
    label: "Thanh toán một phần",
    className: "bg-blue-100 text-blue-700",
  },
  PAID: {
    label: "Đã thanh toán",
    className: "bg-green-100 text-green-700",
  },
  OVERDUE: {
    label: "Quá hạn",
    className: "bg-red-100 text-red-700",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "bg-gray-100 text-gray-600",
  },
};

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: `Tháng ${index + 1}`,
}));

const PAGE_SIZE = 10;

function formatMoney(value: string | number) {
  return `${Number(value).toLocaleString("vi-VN")} đ`;
}

function formatNumber(value: string | number) {
  return Number(value).toLocaleString("vi-VN");
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getRemainingAmount(invoice: Invoice) {
  return Math.max(
    0,
    Number(invoice.total_amount) - Number(invoice.paid_amount)
  );
}

function unwrapData<T>(result: any): T {
  return (result.data?.data ?? result.data) as T;
}

function getErrorMessage(result: any) {
  return result?.message || "Không thể tải danh sách hóa đơn.";
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        config?.className ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {config?.label ?? status}
    </span>
  );
}

export default function TenantInvoicesPage() {
  const currentYear = new Date().getFullYear();

  // Filters
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");

  // Data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Pagination
  const [page, setPage] = useState(1);

  // Loading / Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInvoices = useCallback(
    async (signal: AbortSignal) => {
      try {
        setLoading(true);
        setError("");

        const query = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });

        if (month) {
          query.set("billing_month", month);
        }

        if (year) {
          query.set("billing_year", year);
        }

        if (status) {
          query.set("status", status);
        }

      const response = await fetch(
        `/api/tenant/invoices?${query.toString()}`,
        {
          cache: "no-store",
          signal,
        }
      );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(getErrorMessage(result));
        }

        const data = unwrapData<InvoiceListResponse>(result);

        setInvoices(data.invoices ?? []);
        setPagination(data.pagination ?? null);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setInvoices([]);
        setPagination(null);

        setError(
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi tải hóa đơn."
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [page, month, year, status]
  );

  useEffect(() => {
    const controller = new AbortController();

    void fetchInvoices(controller.signal);

    return () => controller.abort();
  }, [fetchInvoices]);

  // ======================================================
  // FILTER HANDLERS
  // ======================================================

  const handleMonthChange = (value: string) => {
    setMonth(value);
    setPage(1);
  };

  const handleYearChange = (value: string) => {
    setYear(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setMonth("");
    setYear("");
    setStatus("");
    setPage(1);
  };

  // ======================================================
  // SUMMARY
  // ======================================================

  const totalUnpaid = invoices.filter(
    (item) =>
      item.status === "UNPAID" ||
      item.status === "OVERDUE"
  ).length;

  const totalPaid = invoices.filter(
    (item) => item.status === "PAID"
  ).length;

  const totalRemaining = invoices
    .filter((item) => item.status !== "CANCELLED")
    .reduce(
      (sum, item) => sum + getRemainingAmount(item),
      0
    );

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      {/* HEADER */}
      <div className="mt-5">

        <div className="flex items-center gap-2 text-sm text-slate-500">
            <House size={16} />
            <Link href = "/tenant/dashboard" className="hover:underline hover:text-blue-600"><span>Xóm Cũ</span></Link>
            <ChevronRight size={14} />
            <span className="text-blue-600">Hóa đơn</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hóa đơn của tôi
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi hóa đơn tiền phòng, các khoản phí và tình trạng thanh toán.
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="h-4 w-4" />
            Tổng hóa đơn
          </div>

          <p className="mt-2 text-2xl font-bold">
            {pagination?.totalItems ?? 0}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            Chưa thanh toán / Quá hạn
          </div>

          <p className="mt-2 text-2xl font-bold text-amber-600">
            {loading ? "—" : totalUnpaid}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            Còn phải thanh toán (trang hiện tại)
          </div>

          <p className="mt-2 text-xl font-bold">
            {loading ? "—" : formatMoney(totalRemaining)}
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />

          <h2 className="font-semibold">
            Bộ lọc hóa đơn
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* MONTH */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Tháng
            </label>

            <select
              value={month}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Tất cả các tháng</option>

              {MONTH_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* YEAR */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Năm
            </label>

            <select
              value={year}
              onChange={(e) => handleYearChange(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Tất cả các năm</option>

              {Array.from(
                { length: 6 },
                (_, index) => currentYear - index
              ).map((item) => (
                <option key={item} value={String(item)}>
                  Năm {item}
                </option>
              ))}
            </select>
          </div>

          {/* STATUS */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Trạng thái
            </label>

            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* RESET */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!month && !year && !status}
              className="h-10 w-full rounded-md border px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* INVOICE LIST */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">
            Danh sách hóa đơn
          </h2>

          <p className="text-sm text-muted-foreground">
            {pagination
              ? `Hiển thị ${invoices.length} / ${pagination.totalItems} hóa đơn`
              : ""}
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center gap-3 rounded-xl border">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />

            <p className="text-sm text-muted-foreground">
              Đang tải danh sách hóa đơn...
            </p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
            <Receipt className="mb-3 h-10 w-10 text-muted-foreground" />

            <h3 className="font-semibold">
              Không tìm thấy hóa đơn
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Không có hóa đơn phù hợp với kỳ và trạng thái bạn đã chọn.
            </p>
          </div>
        ) : (
          <Accordion  className="space-y-3">
            {invoices.map((invoice) => {
              const remaining = getRemainingAmount(invoice);

              return (
                <AccordionItem
                  key={invoice.id}
                  value={String(invoice.id)}
                  className="overflow-hidden rounded-xl border bg-card px-4"
                >
                  {/* ACCORDION HEADER */}
                  <AccordionTrigger className="py-5 text-left hover:no-underline">
                    <div className="flex w-full flex-col gap-3 pr-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">
                            {invoice.invoice_number}
                          </span>

                          <StatusBadge status={invoice.status} />
                        </div>

                        <p className="text-sm text-muted-foreground">
                          Kỳ hóa đơn:{" "}
                          <span className="font-medium text-foreground">
                            Tháng{" "}
                            {String(invoice.billing_month).padStart(2, "0")}
                            /{invoice.billing_year}
                          </span>
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Phòng{" "}
                          {invoice.rental_contracts?.rooms?.room_number ??
                            "—"}
                          {" · "}
                          Hợp đồng{" "}
                          {invoice.rental_contracts?.contract_number ?? "—"}
                        </p>
                      </div>

                      <div className="space-y-1 sm:min-w-[180px] sm:text-right">
                        <p className="text-xs text-muted-foreground">
                          Tổng hóa đơn
                        </p>

                        <p className="text-lg font-bold">
                          {formatMoney(invoice.total_amount)}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Còn lại:{" "}
                          <span className="font-semibold text-foreground">
                            {formatMoney(remaining)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>

                  {/* ACCORDION CONTENT */}
                  <AccordionContent className="pb-5">
                    <div className="space-y-5 border-t pt-5">
                      {/* BASIC INFORMATION */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Ngày lập hóa đơn
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {formatDate(invoice.issue_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Hạn thanh toán
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {formatDate(invoice.due_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Đã thanh toán
                          </p>

                          <p className="mt-1 text-sm font-medium text-green-600">
                            {formatMoney(invoice.paid_amount)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Còn phải thanh toán
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {formatMoney(remaining)}
                          </p>
                        </div>
                      </div>

                      {/* INVOICE ITEMS */}
                      <div>
                        <h3 className="mb-3 font-semibold">
                          Chi tiết các khoản phí
                        </h3>

                        <div className="overflow-x-auto rounded-lg border">
                          <table className="w-full min-w-[650px] text-sm">
                            <thead className="bg-muted/50">
                              <tr className="text-left">
                                <th className="p-3 font-medium">STT</th>

                                <th className="p-3 font-medium">
                                  Khoản phí
                                </th>

                                <th className="p-3 text-right font-medium">
                                  Số lượng
                                </th>

                                <th className="p-3 text-right font-medium">
                                  Đơn giá
                                </th>

                                <th className="p-3 text-right font-medium">
                                  Thành tiền
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y">
                              {invoice.invoice_items?.map(
                                (item, index) => (
                                  <tr key={item.id}>
                                    <td className="p-3">
                                      {index + 1}
                                    </td>

                                    <td className="p-3">
                                      <p className="font-medium">
                                        {item.description}
                                      </p>

                                      {item.services && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          Đơn vị: {item.services.unit}
                                        </p>
                                      )}

                                      {item.meter_readings && (
                                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                          <p>
                                            Chỉ số cũ:{" "}
                                            {formatNumber(
                                              item.meter_readings.old_value
                                            )}
                                          </p>

                                          <p>
                                            Chỉ số mới:{" "}
                                            {formatNumber(
                                              item.meter_readings.new_value
                                            )}
                                          </p>

                                          <p>
                                            Tiêu thụ:{" "}
                                            {item.meter_readings.consumption ===
                                            null
                                              ? "—"
                                              : formatNumber(
                                                  item.meter_readings
                                                    .consumption
                                                )}
                                          </p>
                                        </div>
                                      )}
                                    </td>

                                    <td className="p-3 text-right">
                                      {formatNumber(item.quantity)}
                                    </td>

                                    <td className="p-3 text-right">
                                      {formatMoney(item.unit_price)}
                                    </td>

                                    <td className="p-3 text-right font-semibold">
                                      {formatMoney(item.subtotal)}
                                    </td>
                                  </tr>
                                )
                              )}

                              {(!invoice.invoice_items ||
                                invoice.invoice_items.length === 0) && (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="p-6 text-center text-muted-foreground"
                                  >
                                    Hóa đơn chưa có khoản phí nào.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* TOTAL */}
                      <div className="ml-auto max-w-sm space-y-3 rounded-lg bg-muted/40 p-4">
                        <div className="flex justify-between gap-4 text-sm">
                          <span className="text-muted-foreground">
                            Tổng hóa đơn
                          </span>

                          <span className="font-semibold">
                            {formatMoney(invoice.total_amount)}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4 text-sm">
                          <span className="text-muted-foreground">
                            Đã thanh toán
                          </span>

                          <span className="font-semibold text-green-600">
                            {formatMoney(invoice.paid_amount)}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4 border-t pt-3">
                          <span className="font-semibold">
                            Còn phải thanh toán
                          </span>

                          <span className="font-bold text-primary">
                            {formatMoney(remaining)}
                          </span>
                        </div>
                      </div>

                      {invoice.note && (
                        <div className="rounded-lg border p-3">
                          <p className="text-sm font-medium">
                            Ghi chú hóa đơn
                          </p>

                          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                            {invoice.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      {/* PAGINATION */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {pagination.page} / {pagination.totalPages}
            {" · "}
            Tổng {pagination.totalItems} hóa đơn
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </button>

            <button
              type="button"
              disabled={!pagination.hasNextPage || loading}
              onClick={() =>
                setPage((prev) => Math.min(pagination.totalPages, prev + 1))
              }
              className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}