
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  House,
  Loader2,
  Package,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  TenantAsset,
  TenantAssetsResponse,
  AssetCondition,
} from "@/lib/types/tenant-asset-incident.type";

const CONDITION_CONFIG: Record<
  AssetCondition,
  { label: string; className: string }
> = {
  GOOD: {
    label: "Tốt",
    className: "bg-green-100 text-green-700",
  },
  DAMAGED: {
    label: "Bị hư hỏng",
    className: "bg-amber-100 text-amber-700",
  },
  UNDER_REPAIR: {
    label: "Đang sửa chữa",
    className: "bg-blue-100 text-blue-700",
  },
  BROKEN: {
    label: "Đã hỏng",
    className: "bg-red-100 text-red-700",
  },
};

function unwrapData<T>(result: any): T {
  return (result.data?.data ?? result.data) as T;
}

export default function TenantAssetsPage() {
  const [assets, setAssets] = useState<TenantAsset[]>([]);
  const [room, setRoom] = useState<TenantAssetsResponse["room"] | null>(null);
  const [contract, setContract] =
    useState<TenantAssetsResponse["contract"] | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAssets = useCallback(async (signal: AbortSignal) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/tenant/assets", {
        method: "GET",
        cache: "no-store",
        signal,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải tài sản.");
      }

      const data = unwrapData<TenantAssetsResponse>(result);

      setAssets(data.assets ?? []);
      setRoom(data.room ?? null);
      setContract(data.contract ?? null);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải tài sản.",
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchAssets(controller.signal);
    return () => controller.abort();
  }, [fetchAssets]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      <div className="mt-5 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <House size={16} />
          <Link href="/tenant/dashboard" className="hover:text-blue-600">
            Xóm Cũ
          </Link>
          <ChevronRight size={14} />
          <span className="text-blue-600">Tài sản phòng</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          Tài sản phòng thuê
        </h1>

        <p className="text-sm text-muted-foreground">
          Danh sách tài sản được bàn giao và sử dụng trong phòng của bạn.
        </p>
      </div>

      {room && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Phòng đang thuê</p>
              <p className="mt-1 text-xl font-bold">
                Phòng {room.room_number}
              </p>
            </div>

            <div className="text-sm text-muted-foreground">
              Hợp đồng:{" "}
              <span className="font-medium text-foreground">
                {contract?.contract_number ?? "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            Tổng loại tài sản
          </div>
          <p className="mt-2 text-2xl font-bold">
            {loading ? "—" : assets.length}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            Tài sản đang hoạt động
          </div>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {loading ? "—" : assets.filter((item) => item.is_active).length}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Danh sách tài sản</h2>
        <Link href="/tenant/reports/incidents">
          <Button variant="outline" size="sm">
            Báo cáo sự cố
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Đang tải danh sách tài sản...
          </p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      ) : assets.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <Package className="mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="font-semibold">Chưa có tài sản</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Phòng thuê hiện chưa có tài sản được ghi nhận.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => {
            const config = CONDITION_CONFIG[asset.condition];

            return (
              <div
                key={asset.id}
                className="overflow-hidden rounded-xl border bg-card"
              >
                <div className="flex h-48 items-center justify-center bg-muted/30 p-3">
                  {asset.image_url ? (
                    <img
                      src={asset.image_url}
                      alt={asset.name}
                      className="h-full w-full rounded-lg object-contain"
                    />
                  ) : (
                    <Package className="h-14 w-14 text-muted-foreground/40" />
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{asset.name}</h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
                    >
                      {config.label}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Số lượng:{" "}
                    <span className="font-medium text-foreground">
                      {asset.quantity}
                    </span>
                  </p>

                  {asset.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {asset.description}
                    </p>
                  )}

                  {asset.note && (
                    <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                      Ghi chú: {asset.note}
                    </p>
                  )}

                  <Link
                    href={`/tenant/reports/incidents/create?asset_id=${asset.id}`}
                    className="block"
                  >
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={!asset.is_active}
                    >
                      <Wrench className="mr-2 h-4 w-4" />
                      Báo cáo sự cố
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
