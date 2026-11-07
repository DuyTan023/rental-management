"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Loader2,
  CalendarDays,
  House,
  ChevronRight
} from "lucide-react";

type ContractStatus =
  | "DRAFT"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED"
  | "COMPLETED";

type TenantContract = {
  id: string;
  contract_id: string;
  role: string;
  status: string;
  rental_contracts: {
    id: string;
    contract_number: string;
    status: ContractStatus;
    start_date?: string;
    end_date?: string | null;
    rent_price?: string | number;
    rooms?: {
      room_number?: string;
    };
  } | null;
};

type ProfileResponse = {
  id: string;
  contract_tenants: TenantContract[];
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const statusConfig: Record<
  ContractStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Bản nháp",
    className: "bg-gray-100 text-gray-700",
  },
  ACTIVE: {
    label: "Đang hiệu lực",
    className: "bg-green-100 text-green-700",
  },
  EXPIRED: {
    label: "Đã hết hạn",
    className: "bg-gray-100 text-gray-700",
  },
  TERMINATED: {
    label: "Đã chấm dứt",
    className: "bg-red-100 text-red-700",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    className: "bg-blue-100 text-blue-700",
  },
};

function formatDate(value?: string | null) {
  if (!value) return "Không xác định";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(value?: string | number) {
  if (value === undefined || value === null) return "—";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value));
}

export default function TenantRentalContractsPage() {
  const { data: session, status: sessionStatus } = useSession();

  const [contracts, setContracts] = useState<TenantContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async (signal?: AbortSignal) => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Bước 1: Tìm profile theo user đăng nhập.
      const profileResponse = await fetch(
        `/api/landlord/profiles/user/${encodeURIComponent(session.user.id)}`,
        {
          cache: "no-store",
          signal,
        }
      );

      const profileResult: ApiResponse<{ id: string }> =
        await profileResponse.json();

      if (!profileResponse.ok || !profileResult.success) {
        throw new Error(
          profileResult.message || "Không tìm thấy hồ sơ người thuê."
        );
      }

      const profileId = profileResult.data.id;

      // Bước 2: Lấy profile cùng danh sách hợp đồng đã tham gia.
      const detailResponse = await fetch(
        `/api/landlord/profiles/${profileId}`,
        {
          cache: "no-store",
          signal,
        }
      );

      const detailResult: ApiResponse<ProfileResponse> =
        await detailResponse.json();

      if (!detailResponse.ok || !detailResult.success) {
        throw new Error(
          detailResult.message || "Không thể tải danh sách hợp đồng."
        );
      }

      const tenantContracts = detailResult.data.contract_tenants ?? [];

      // Chỉ giữ hợp đồng có thông tin rental_contracts.
      // Không lọc status ACTIVE vì cần hiển thị cả hợp đồng cũ.
      const validContracts = tenantContracts.filter(
        (item) => item.rental_contracts !== null
      );

      // Đưa hợp đồng đang hiệu lực lên đầu danh sách.
      // Các hợp đồng còn lại sắp xếp theo ngày bắt đầu mới nhất.
      validContracts.sort((a, b) => {
        const aActive = a.rental_contracts?.status === "ACTIVE";
        const bActive = b.rental_contracts?.status === "ACTIVE";

        if (aActive !== bActive) {
          return aActive ? -1 : 1;
        }

        const aDate = new Date(
          a.rental_contracts?.start_date ?? 0
        ).getTime();

        const bDate = new Date(
          b.rental_contracts?.start_date ?? 0
        ).getTime();

        return bDate - aDate;
      });

      setContracts(validContracts);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải danh sách hợp đồng."
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (!session?.user?.id) {
      setLoading(false);
      setError("Vui lòng đăng nhập để xem hợp đồng.");
      return;
    }

    const controller = new AbortController();

    void fetchContracts(controller.signal);

    return () => controller.abort();
  }, [session, sessionStatus, fetchContracts]);

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Đang tải danh sách hợp đồng...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10 mt-5">

        <div className="flex items-center gap-2 text-sm text-slate-500">
            <House size={16} />
            <Link href = "/tenant/dashboard" className="hover:underline hover:text-blue-600"><span>Xóm Cũ</span></Link>
            <ChevronRight size={14} />
            <span className="text-blue-600">Hợp đồng thuê</span>
        </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hợp đồng thuê phòng
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Danh sách các hợp đồng bạn đã từng tham gia.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Tổng số hợp đồng
          </p>
          <p className="mt-2 text-2xl font-bold">{contracts.length}</p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Đang hiệu lực
          </p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {contracts.filter(
              (item) => item.rental_contracts?.status === "ACTIVE"
            ).length}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Đã kết thúc
          </p>
          <p className="mt-2 text-2xl font-bold">
            {
              contracts.filter(
                (item) =>
                  item.rental_contracts?.status !== "ACTIVE"
              ).length
            }
          </p>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="font-semibold">Chưa có hợp đồng</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Các hợp đồng bạn đã tham gia sẽ được hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {contracts.map((item) => {
            const contract = item.rental_contracts!;

            const status =
              statusConfig[contract.status] ?? {
                label: contract.status,
                className: "bg-gray-100 text-gray-700",
              };

            return (
              <Link
                key={item.id}
                href={`/tenant/contracts/${contract.id}`}
                className="group rounded-xl border bg-card p-5 transition hover:border-primary/50 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-3 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">
                          {contract.contract_number}
                        </h2>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <House className="h-4 w-4" />
                          Phòng{" "}
                          {contract.rooms?.room_number ?? "—"}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(contract.start_date)}
                          {" – "}
                          {formatDate(contract.end_date)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm">
                        Giá thuê theo hợp đồng:{" "}
                        <span className="font-semibold">
                          {formatCurrency(contract.rent_price)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 text-sm font-medium text-primary">
                    Xem chi tiết
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}