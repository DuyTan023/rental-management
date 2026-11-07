
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  ChevronDown,
  History,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ==================== TYPES ====================

type PriceAdjustment = {
  id: string;
  effective_date: string;
  new_rent_price: string | number;
  reason: string | null;
  created_at: string;
};

type PaginationResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type Props = {
  contractId: string;
};

type AdjustmentStatus = "ACTIVE" | "REPLACED" | "FUTURE";

type AdjustmentWithStatus = PriceAdjustment & {
  adjustmentStatus: AdjustmentStatus;
};

const PAGE_SIZE = 10;

// ==================== FORMAT ====================

function formatCurrency(value: string | number) {
  const amount = Number(value);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

// Chuẩn hóa ngày về YYYY-MM-DD
function dateKey(value: string | Date) {
  if (typeof value === "string") {
    const match = value.match(/^\d{4}-\d{2}-\d{2}/);

    if (match) return match[0];
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function todayString() {
  return dateKey(new Date());
}

function formatDate(value: string) {
  const key = dateKey(value);
  const parts = key.split("-");

  if (parts.length !== 3 || !key) {
    return "Không xác định";
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Sắp xếp ngày hiệu lực mới nhất trước.
// Nếu cùng ngày, bản ghi tạo sau được ưu tiên.
function compareAdjustments(
  a: PriceAdjustment,
  b: PriceAdjustment
) {
  const dateDifference = dateKey(b.effective_date).localeCompare(
    dateKey(a.effective_date)
  );

  if (dateDifference !== 0) return dateDifference;

  return (
    new Date(b.created_at).getTime() -
    new Date(a.created_at).getTime()
  );
}

// ==================== STATUS ====================

const statusConfig: Record<
  AdjustmentStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Đang áp dụng",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },

  REPLACED: {
    label: "Đã thay thế",
    className: "border-red-200 bg-red-100 text-red-600",
  },

  FUTURE: {
    label: "Chưa có hiệu lực",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
};

// ==================== COMPONENT ====================

export default function ContractRentHistory({
  contractId,
}: Props) {
  const [history, setHistory] = useState<PriceAdjustment[]>([]);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const baseUrl =
    `/api/landlord/rental_contracts/${encodeURIComponent(contractId)}/price_ajustments`;

  // ==================== LOAD HISTORY ====================

  const loadHistory = useCallback(
    async (
      requestedPage: number,
      append = false,
      signal?: AbortSignal
    ) => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${baseUrl}?page=${requestedPage}&limit=${PAGE_SIZE}`,
          {
            cache: "no-store",
            signal,
          }
        );

        const result: ApiResponse<PaginationResult<PriceAdjustment>> =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Không thể tải lịch sử điều chỉnh giá."
          );
        }

        if (signal?.aborted) return;

        setHistory((previous) => {
          if (!append) return result.data.data;

          const existingIds = new Set(
            previous.map((item) => item.id)
          );

          const newItems = result.data.data.filter(
            (item) => !existingIds.has(item.id)
          );

          return [...previous, ...newItems];
        });

        setTotal(result.data.total);
        setPage(requestedPage);
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === "AbortError"
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi tải lịch sử."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [baseUrl]
  );

  // Tải lịch sử khi hợp đồng thay đổi
  useEffect(() => {
    const controller = new AbortController();

    setHistory([]);
    setPage(1);
    setTotal(0);

    void loadHistory(1, false, controller.signal);

    return () => controller.abort();
  }, [loadHistory]);

  // ==================== CLASSIFY HISTORY ====================

  const today = todayString();

  const historyWithStatus = useMemo<
    AdjustmentWithStatus[]
  >(() => {
    const sorted = [...history].sort(compareAdjustments);

    const applicable = sorted
      .filter(
        (item) => dateKey(item.effective_date) <= today
      )
      .sort(compareAdjustments);

    const activeId = applicable[0]?.id;

    return sorted.map((item) => {
      const key = dateKey(item.effective_date);

      let adjustmentStatus: AdjustmentStatus;

      if (key > today) {
        adjustmentStatus = "FUTURE";
      } else if (item.id === activeId) {
        adjustmentStatus = "ACTIVE";
      } else {
        adjustmentStatus = "REPLACED";
      }

      return {
        ...item,
        adjustmentStatus,
      };
    });
  }, [history, today]);

  // ==================== PAGINATION ====================

  const hasMore = history.length < total;

  // ==================== RENDER ====================

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-blue-600" />

          <CardTitle className="text-lg">
            Lịch sử điều chỉnh giá phòng theo hợp đồng
          </CardTitle>
        </div>

        <p className="text-sm text-slate-500">
          Có {total} lần điều chỉnh giá được ghi nhận.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ERROR */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && history.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải lịch sử...
          </div>
        ) : history.length === 0 ? (
          /* EMPTY */
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
            <History className="mx-auto h-8 w-8 text-slate-300" />

            <p className="mt-2 font-medium text-slate-700">
              Chưa có lịch sử điều chỉnh giá
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Các lần điều chỉnh giá phòng sẽ được hiển thị tại đây.
            </p>
          </div>
        ) : (
          /* HISTORY LIST */
          <div className="space-y-3">
            {historyWithStatus.map((item) => {
              const status = statusConfig[item.adjustmentStatus];

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 ${
                    item.adjustmentStatus === "ACTIVE"
                      ? "border-emerald-200 bg-emerald-50/30"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                        <CalendarDays className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800">
                          {formatCurrency(item.new_rent_price)}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Hiệu lực từ{" "}
                          {formatDate(item.effective_date)}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`w-fit ${status.className}`}
                    >
                      {status.label}
                    </Badge>
                  </div>

                  {/* REASON */}
                  {item.reason && (
                    <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                      <span className="font-medium">
                        Lý do:{" "}
                      </span>
                      {item.reason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* LOAD MORE */}
        {hasMore && (
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={loading}
            onClick={() => void loadHistory(page + 1, true)}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Xem thêm
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
