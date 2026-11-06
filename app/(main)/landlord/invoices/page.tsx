"use client";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type InvoiceStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

type Invoice = {
  id: string;
  invoice_number: string;
  billing_month: number;
  billing_year: number;
  issue_date: string;
  due_date: string;
  total_amount: number | string;
  paid_amount: number | string;
  status: InvoiceStatus;
  rental_contracts: {
    contract_number: string;
    rooms: {
      room_number: string;
    };
    contract_tenants?: {
      profiles: {
        full_name: string;
      };
    }[];
  };
};

type InvoiceResponse = {
  items: Invoice[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

const PAGE_SIZE = 10;

const STATUS_OPTIONS: {
  value: InvoiceStatus | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "UNPAID", label: "Chưa thanh toán" },
  { value: "PARTIALLY_PAID", label: "Thanh toán một phần" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "OVERDUE", label: "Quá hạn" },
  { value: "CANCELLED", label: "Đã hủy" },
];

function formatMoney(value: number | string) {
  return `${Number(value).toLocaleString("vi-VN")} đ`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusLabel(status: InvoiceStatus) {
  const labels: Record<InvoiceStatus, string> = {
    UNPAID: "Chưa thanh toán",
    PARTIALLY_PAID: "Thanh toán một phần",
    PAID: "Đã thanh toán",
    OVERDUE: "Quá hạn",
    CANCELLED: "Đã hủy",
  };

  return labels[status];
}

function getStatusClass(status: InvoiceStatus) {
  const classes: Record<InvoiceStatus, string> = {
    UNPAID: "bg-amber-100 text-amber-700",
    PARTIALLY_PAID: "bg-blue-100 text-blue-700",
    PAID: "bg-green-100 text-green-700",
    OVERDUE: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-600",
  };

  return classes[status];
}

function getTenantNames(invoice: Invoice) {
  const tenants =
    invoice.rental_contracts?.contract_tenants ?? [];

  if (tenants.length === 0) {
    return "Chưa có thông tin";
  }

  return tenants
    .map((tenant) => tenant.profiles?.full_name)
    .filter(Boolean)
    .join(", ");
}

function unwrapData<T>(result: any): T {
  return (result.data?.data ?? result.data) as T;
}

export default function InvoicesPage() {
  const now = new Date();

  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [status, setStatus] = useState("ALL");
  const [keyword, setKeyword] = useState("");

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        month,
        year,
      });

      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      }

      if (status !== "ALL") {
        params.set("status", status);
      }

      const response = await fetch(
        `/api/landlord/invoices?${params.toString()}`,
        { cache: "no-store" },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể tải danh sách hóa đơn",
        );
      }

      const data = unwrapData<InvoiceResponse>(result);
      const pagination = data.pagination;

      setItems(data.items ?? []);
      setTotal(pagination?.total ?? data.total ?? 0);
      setTotalPages(
        pagination?.totalPages ?? data.totalPages ?? 1,
      );
    } catch (error) {
      console.error("Fetch invoices:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi tải hóa đơn",
      );

      setItems([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, month, year, status, keyword]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Khi thay đổi bộ lọc thì quay về trang đầu tiên.
  const handleFilterChange = (
    callback: () => void,
  ) => {
    setPage(1);
    callback();
  };

  const summary = useMemo(() => {
    return {
      total: total,
      currentPageCount: items.length,
      totalAmount: items.reduce(
        (sum, item) => sum + Number(item.total_amount),
        0,
      ),
      paidAmount: items.reduce(
        (sum, item) => sum + Number(item.paid_amount),
        0,
      ),
    };
  }, [items, total]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Quản lý hóa đơn
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi hóa đơn tiền phòng, dịch vụ và tình trạng thanh toán.
          </p>
        </div>

        <button
          onClick={fetchInvoices}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw
            className={`size-4 ${loading ? "animate-spin" : ""}`}
          />
          Làm mới
        </button>
      </div>

      {/* FILTER PERIOD */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
        <FileText className="size-5 text-muted-foreground" />

        <span className="text-sm font-medium">
          Kỳ hóa đơn:
        </span>

        <select
          value={month}
          onChange={(e) =>
            handleFilterChange(() => setMonth(e.target.value))
          }
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          {Array.from({ length: 12 }, (_, index) => (
            <option key={index + 1} value={String(index + 1)}>
              Tháng {index + 1}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) =>
            handleFilterChange(() => setYear(e.target.value))
          }
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          {Array.from(
            { length: 6 },
            (_, index) => now.getFullYear() - 2 + index,
          ).map((item) => (
            <option key={item} value={String(item)}>
              {item}
            </option>
          ))}
        </select>

        <span className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
          Tháng {month.padStart(2, "0")}/{year}
        </span>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Tổng hóa đơn"
          value={summary.total}
          description="Số hóa đơn phù hợp bộ lọc"
          icon={<FileText className="size-5" />}
        />

        <SummaryCard
          title="Tổng tiền trang hiện tại"
          value={formatMoney(summary.totalAmount)}
          description={`${summary.currentPageCount} hóa đơn đang hiển thị`}
          icon={<Wallet className="size-5" />}
        />

        <SummaryCard
          title="Đã thanh toán trang hiện tại"
          value={formatMoney(summary.paidAmount)}
          description="Tổng tiền đã thu trên trang này"
          icon={<Wallet className="size-5" />}
        />
      </div>

      {/* SEARCH & STATUS */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={keyword}
            onChange={(e) =>
              handleFilterChange(() => setKeyword(e.target.value))
            }
            placeholder="Tìm mã hóa đơn, phòng, hợp đồng, người thuê..."
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={status}
          onChange={(e) =>
            handleFilterChange(() => setStatus(e.target.value))
          }
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b p-4">
          <h2 className="font-semibold">Danh sách hóa đơn</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Đang tải dữ liệu..."
              : `${total} hóa đơn được tìm thấy`}
          </p>
        </div>

        {error && (
          <div className="m-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>

            <button
              onClick={fetchInvoices}
              className="ml-auto font-medium underline"
            >
              Thử lại
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-4 font-medium">Mã hóa đơn</th>
                <th className="p-4 font-medium">Phòng</th>
                <th className="p-4 font-medium">Người thuê</th>
                <th className="p-4 font-medium">Ngày lập</th>
                <th className="p-4 font-medium">Hạn thanh toán</th>
                <th className="p-4 text-right font-medium">Tổng tiền</th>
                <th className="p-4 text-right font-medium">Đã trả</th>
                <th className="p-4 text-center font-medium">Trạng thái</th>
                <th className="p-4 text-right font-medium">Chi tiết</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-10 text-center text-muted-foreground"
                  >
                    Đang tải danh sách hóa đơn...
                  </td>
                </tr>
              ) : (
                items.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-muted/30"
                  >
                    <td className="p-4 font-semibold">
                      {invoice.invoice_number}
                    </td>

                    <td className="p-4">
                      {invoice.rental_contracts?.rooms?.room_number ?? "—"}
                    </td>

                    <td className="max-w-[200px] p-4">
                      <span className="line-clamp-2">
                        {getTenantNames(invoice)}
                      </span>
                    </td>

                    <td className="p-4">
                      {formatDate(invoice.issue_date)}
                    </td>

                    <td className="p-4">
                      {formatDate(invoice.due_date)}
                    </td>

                    <td className="p-4 text-right font-medium">
                      {formatMoney(invoice.total_amount)}
                    </td>

                    <td className="p-4 text-right">
                      {formatMoney(invoice.paid_amount)}
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(invoice.status)}`}
                      >
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <Link
                        href={`/landlord/invoices/${invoice.id}`}
                        className="inline-flex items-center gap-2 rounded-md border px-3 py-2 font-medium hover:bg-muted"
                      >
                        <Eye className="size-4" />
                        Xem
                      </Link>
                    </td>
                  </tr>
                ))
              )}

              {!loading && items.length === 0 && !error && (
                <tr>
                  <td
                    colSpan={9}
                    className="p-10 text-center text-muted-foreground"
                  >
                    Không tìm thấy hóa đơn phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {page}/{Math.max(totalPages, 1)} · Tổng {total} hóa đơn
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
              Trước
            </button>

            <span className="min-w-10 text-center text-sm font-medium">
              {page}
            </span>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}