
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Clock,
  FileWarning,
  House,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type IncidentStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED";

type IncidentPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type Incident = {
  id: string;
  title: string;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  image_urls: string[];
  created_at: string;
  rooms?: { room_number: string };
  room_assets?: { name: string } | null;
  users?: {
    email: string;
    profiles?: { full_name: string | null } | null;
  };
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const STATUS_CONFIG: Record<IncidentStatus, {
  label: string;
  className: string;
}> = {
  PENDING: { label: "Chờ xử lý", className: "bg-amber-100 text-amber-700" },
  IN_PROGRESS: { label: "Đang xử lý", className: "bg-blue-100 text-blue-700" },
  RESOLVED: { label: "Đã giải quyết", className: "bg-green-100 text-green-700" },
  REJECTED: { label: "Đã từ chối", className: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Đã hủy", className: "bg-gray-100 text-gray-600" },
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

export default function LandlordIncidentsPage() {
  const [items, setItems] = useState<Incident[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomInput, setRoomInput] = useState("");

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

      if (status) query.set("status", status);
      if (priority) query.set("priority", priority);
      if (roomId) query.set("room_id", roomId);

      const response = await fetch(
        `/api/landlord/incidents?${query.toString()}`,
        { cache: "no-store", signal },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải báo cáo sự cố.");
      }

      const data = unwrapData<{
        items: Incident[];
        pagination: Pagination;
      }>(result);

      setItems(data.items ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setItems([]);
      setPagination(null);
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải báo cáo.",
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, status, priority, roomId]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchIncidents(controller.signal);
    return () => controller.abort();
  }, [fetchIncidents]);

  const applyRoomFilter = () => {
    setPage(1);
    setRoomId(roomInput.trim());
  };

  const resetFilters = () => {
    setStatus("");
    setPriority("");
    setRoomId("");
    setRoomInput("");
    setPage(1);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      <div className="mt-5 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <House size={16} />
          <Link href="/landlord/dashboard" className="hover:text-blue-600">
            Xóm Cũ
          </Link>
          <ChevronRight size={14} />
          <span className="text-blue-600">Quản lý sự cố</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          Quản lý báo cáo sự cố
        </h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi và xử lý các báo cáo sự cố do người thuê gửi.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <FileWarning className="h-5 w-5 text-primary" />
          Bộ lọc báo cáo
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="IN_PROGRESS">Đang xử lý</option>
              <option value="RESOLVED">Đã giải quyết</option>
              <option value="REJECTED">Đã từ chối</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mức độ ưu tiên</label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Tất cả mức độ</option>
              <option value="LOW">Thấp</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HIGH">Cao</option>
              <option value="URGENT">Khẩn cấp</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">ID phòng</label>
            <Input
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              placeholder="Nhập ID phòng"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button className="flex-1" onClick={applyRoomFilter}>
              Lọc
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              Đặt lại
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Danh sách báo cáo</h2>
        <span className="text-sm text-muted-foreground">
          {pagination ? `${pagination.total} báo cáo` : ""}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Đang tải báo cáo...
          </p>
        </div>
      ) : !error && items.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <FileWarning className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="font-semibold">Không có báo cáo sự cố</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Chưa có báo cáo phù hợp với bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((incident) => {
            const statusConfig = STATUS_CONFIG[incident.status];
            const priorityConfig = PRIORITY_CONFIG[incident.priority];

            return (
              <div
                key={incident.id}
                className="rounded-xl border bg-card p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{incident.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityConfig.className}`}>
                        {priorityConfig.label}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Phòng{" "}
                      <span className="font-medium text-foreground">
                        {incident.rooms?.room_number ?? "—"}
                      </span>
                      {" · "}Tài sản:{" "}
                      <span className="font-medium text-foreground">
                        {incident.room_assets?.name ?? "Sự cố chung"}
                      </span>
                    </p>

                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {incident.description}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>
                        Người báo cáo:{" "}
                        {incident.users?.profiles?.full_name ||
                          incident.users?.email ||
                          "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(incident.created_at)}
                      </span>
                      <span>{incident.image_urls?.length ?? 0} hình ảnh</span>
                    </div>
                  </div>

                  <Link href={`/landlord/incidents/${incident.id}`}>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Xem và xử lý
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
              onClick={() =>
                setPage((prev) => Math.min(pagination.totalPages, prev + 1))
              }
            >
              Trang sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
