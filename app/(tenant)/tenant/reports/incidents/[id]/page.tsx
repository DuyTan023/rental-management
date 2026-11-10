
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileWarning,
  House,
  Loader2,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  TenantIncident,
  IncidentStatus,
  IncidentPriority,
} from "@/lib/types/tenant-asset-incident.type";

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

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function TenantIncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [incident, setIncident] = useState<TenantIncident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchIncident = useCallback(async (signal: AbortSignal) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/public/incidents/${id}`, {
        method: "GET",
        cache: "no-store",
        signal,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải chi tiết sự cố.");
      }

      const data = unwrapData<TenantIncident>(result);
      setIncident(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải sự cố.",
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchIncident(controller.signal);
    return () => controller.abort();
  }, [fetchIncident]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[300px] max-w-6xl flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Đang tải chi tiết sự cố...
        </p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 py-8">
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error || "Không tìm thấy báo cáo sự cố."}
        </div>
        <Link href="/tenant/incidents">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[incident.status];
  const priority = PRIORITY_CONFIG[incident.priority];

  const updates = [...(incident.asset_incident_updates ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
      <div className="mt-5 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <House size={16} />
          <Link href="/tenant/dashboard" className="hover:text-blue-600">
            Xóm Cũ
          </Link>
          <ChevronRight size={14} />
          <Link href="/tenant/reports/incidents" className="hover:text-blue-600">
            Báo cáo sự cố
          </Link>
          <ChevronRight size={14} />
          <span className="text-blue-600">Chi tiết</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Chi tiết báo cáo sự cố
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Theo dõi thông tin và tiến độ xử lý báo cáo của bạn.
            </p>
          </div>

          <Link href="/tenant/reports/incidents">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">{incident.title}</h2>
            <p className="text-sm text-muted-foreground">
              Mã báo cáo: #{incident.id}
            </p>
          </div>

          <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
        </div>

        <div className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Phòng</p>
            <p className="mt-1 font-medium">
              {incident.rooms?.room_number ?? "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Tài sản</p>
            <p className="mt-1 font-medium">
              {incident.room_assets?.name ?? "Sự cố chung"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Mức độ ưu tiên</p>
            <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${priority.className}`}>
              {priority.label}
            </span>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Ngày gửi báo cáo</p>
            <p className="mt-1 font-medium">
              {formatDate(incident.created_at)}
            </p>
          </div>
        </div>

        <div className="mt-5 border-t pt-5">
          <h3 className="font-semibold">Mô tả sự cố</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {incident.description}
          </p>
        </div>

        {incident.image_urls?.length > 0 && (
          <div className="mt-5 border-t pt-5">
            <h3 className="mb-3 font-semibold">Hình ảnh minh chứng</h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {incident.image_urls.map((url, index) => (
                <a
                  key={`${url}-${index}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-40 items-center justify-center overflow-hidden rounded-lg border bg-muted/20 p-2"
                >
                  <img
                    src={url}
                    alt={`Ảnh sự cố ${index + 1}`}
                    className="max-h-full max-w-full rounded-md object-contain"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {incident.resolution_note && (
          <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Ghi chú xử lý
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-green-800">
              {incident.resolution_note}
            </p>
            {incident.resolved_at && (
              <p className="mt-2 text-xs text-green-700">
                Thời gian giải quyết: {formatDate(incident.resolved_at)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Lịch sử xử lý</h2>
        </div>

        {updates.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Chưa có cập nhật xử lý.
            </p>
          </div>
        ) : (
          <div className="relative space-y-5">
            {updates.map((update, index) => {
              const updateStatus = STATUS_CONFIG[update.new_status];

              return (
                <div key={update.id} className="relative flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <div className="z-10 flex h-9 w-9 items-center justify-center rounded-full border bg-background">
                      {update.new_status === "RESOLVED" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-primary" />
                      )}
                    </div>

                    {index !== updates.length - 1 && (
                      <div className="absolute top-9 h-full w-px bg-border" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${updateStatus.className}`}>
                        {updateStatus.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(update.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserRound className="h-4 w-4" />
                      {update.users?.profiles?.full_name ||
                        update.users?.email ||
                        "Người quản lý"}
                    </div>

                    {update.note && (
                      <p className="whitespace-pre-wrap text-sm text-foreground">
                        {update.note}
                      </p>
                    )}

                    {update.image_urls?.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {update.image_urls.map((url, imageIndex) => (
                          <a
                            key={`${url}-${imageIndex}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-32 items-center justify-center overflow-hidden rounded-lg border bg-muted/20 p-2"
                          >
                            <img
                              src={url}
                              alt="Ảnh cập nhật xử lý"
                              className="max-h-full max-w-full object-contain"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
