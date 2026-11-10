
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronRight,
  Clock,
  FileWarning,
  House,
  Loader2,
  Plus,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  TenantIncident,
  TenantIncidentListResponse,
  IncidentStatus,
  IncidentPriority,
} from "@/lib/types/tenant-asset-incident.type";

const STATUS_CONFIG: Record<IncidentStatus, {
  label: string;
  className: string;
}> = {
  PENDING: {
    label: "Chờ xử lý",
    className: "bg-amber-100 text-amber-700",
  },
  IN_PROGRESS: {
    label: "Đang xử lý",
    className: "bg-blue-100 text-blue-700",
  },
  RESOLVED: {
    label: "Đã giải quyết",
    className: "bg-green-100 text-green-700",
  },
  REJECTED: {
    label: "Đã từ chối",
    className: "bg-red-100 text-red-700",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "bg-gray-100 text-gray-600",
  },
};

const PRIORITY_CONFIG: Record<IncidentPriority, {
  label: string;
  className: string;
}> = {
  LOW: { label: "Thấp", className: "bg-gray-100 text-gray-700" },
  MEDIUM: { label: "Trung bình", className: "bg-blue-100 text-blue-700" },
  HIGH: { label: "Cao", className: "bg-orange-100 text-orange-700" },
  URGENT: { label: "Khẩn cấp", className: "bg-red-100 text-red-700" },
};

function unwrapData<T>(result: any): T {
  return (result.data?.data ?? result.data) as T;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function TenantIncidentsPage() {
  const [items, setItems] = useState<TenantIncident[]>([]);
  const [pagination, setPagination] = useState<
    TenantIncidentListResponse["pagination"] | null
  >(null);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchIncidents = useCallback(async (signal: AbortSignal) => {
    try {
      setLoading(true);
      setError("");

      const query = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      const response = await fetch(
        `/api/tenant/incidents?${query.toString()}`,
        { cache: "no-store", signal },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải báo cáo sự cố.");
      }

      const data = unwrapData<TenantIncidentListResponse>(result);

      setItems(data.items ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setItems([]);
      setPagination(null);
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu.",
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchIncidents(controller.signal);
    return () => controller.abort();
  }, [fetchIncidents]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      <div className="mt-5 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <House size={16} />
          <Link href="/tenant/dashboard" className="hover:text-blue-600">
            Xóm Cũ
          </Link>
          <ChevronRight size={14} />
          <span className="text-blue-600">Báo cáo sự cố</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Báo cáo sự cố
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Theo dõi tình trạng xử lý các sự cố bạn đã gửi.
            </p>
          </div>

          <Link href="/tenant/reports/incidents/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tạo báo cáo
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileWarning className="h-4 w-4" />
          Tổng số báo cáo
        </div>
        <p className="mt-2 text-2xl font-bold">
          {loading ? "—" : pagination?.total ?? 0}
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Đang tải báo cáo...
          </p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <FileWarning className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="font-semibold">Chưa có báo cáo sự cố</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Khi gặp vấn đề với tài sản hoặc phòng thuê, bạn có thể gửi báo cáo.
          </p>
          <Link href="/tenant/reports/incidents/create" className="mt-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tạo báo cáo đầu tiên
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((incident) => {
            const status = STATUS_CONFIG[incident.status];
            const priority = PRIORITY_CONFIG[incident.priority];

            return (
              <div
                key={incident.id}
                className="rounded-xl border bg-card p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{incident.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Tài sản:{" "}
                      <span className="font-medium text-foreground">
                        {incident.room_assets?.name ?? "Sự cố chung"}
                      </span>
                    </p>

                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {incident.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>Phòng {incident.rooms?.room_number ?? "—"}</span>
                      <span className={`rounded-full px-2 py-1 font-medium ${priority.className}`}>
                        Ưu tiên: {priority.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(incident.created_at)}
                      </span>
                    </div>
                  </div>

                  <Link href={`/tenant/reports/incidents/${incident.id}`}>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Xem chi tiết
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {pagination.page}/{pagination.totalPages}
            {" · "}Tổng {pagination.total} báo cáo
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
            >
              Trang sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
