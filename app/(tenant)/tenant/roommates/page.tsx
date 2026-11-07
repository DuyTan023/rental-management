"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, UserRound, Loader2, CalendarDays, House, ChevronRight } from "lucide-react";
import Link from "next/link";

type TenantRole = "REPRESENTATIVE" | "MEMBER";

type Roommate = {
  id: string;
  profile_id: string;
  role: TenantRole;
  status: "ACTIVE" | "LEFT";
  joined_at: string;
  profiles: {
    id: string;
    full_name: string;
  } | null;
};

type ContractDetail = {
  id: string;
  contract_number: string;
  status: string;
  rooms: {
    id: string;
    room_number: string;
  };
  contract_tenants: Roommate[];
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function unwrapData<T>(data: any): T {
  return (data?.data ?? data) as T;
}

export default function RoommatesPage() {
  const { data: session, status: sessionStatus } = useSession();

  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [contractNumber, setContractNumber] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoommates = useCallback(
    async (signal: AbortSignal) => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // 1. Tìm profile của người đang đăng nhập.
        const profileResponse = await fetch(
          `/api/landlord/profiles/user/${encodeURIComponent(session.user.id)}`,
          {
            cache: "no-store",
            signal,
          },
        );

        const profileResult: ApiResponse<{ id: string }> =
          await profileResponse.json();

        if (!profileResponse.ok || !profileResult.success) {
          throw new Error(
            profileResult.message || "Không tìm thấy hồ sơ người thuê.",
          );
        }

        const profileId = String(profileResult.data.id);

        // 2. Lấy các hợp đồng mà profile hiện tại từng tham gia.
        const profileDetailResponse = await fetch(
          `/api/landlord/profiles/${profileId}`,
          {
            cache: "no-store",
            signal,
          },
        );

        const profileDetailResult = await profileDetailResponse.json();

        if (!profileDetailResponse.ok || !profileDetailResult.success) {
          throw new Error(
            profileDetailResult.message || "Không thể tải thông tin hợp đồng.",
          );
        }

        const profile = unwrapData<{
          contract_tenants: {
            contract_id: string;
            status: string;
            rental_contracts: {
              id: string;
              status: string;
            } | null;
          }[];
        }>(profileDetailResult.data);

        // 3. Tìm hợp đồng đang hiệu lực.
        const activeContracts = (profile.contract_tenants ?? []).filter(
          (item) =>
            item.status === "ACTIVE" &&
            item.rental_contracts?.status === "ACTIVE",
        );

        if (activeContracts.length === 0) {
          setRoommates([]);
          setRoomNumber(null);
          setContractNumber(null);
          return;
        }

        // Theo quy tắc nghiệp vụ, mỗi người thuê chỉ có một
        // hợp đồng đang hiệu lực.
        const activeContractId = String(
          activeContracts[0].rental_contracts!.id,
        );

        // 4. Lấy chi tiết hợp đồng để lấy danh sách người cùng thuê.
        const contractResponse = await fetch(
          `/api/landlord/rental_contracts/${activeContractId}`,
          {
            cache: "no-store",
            signal,
          },
        );

        const contractResult = await contractResponse.json();

        if (!contractResponse.ok || !contractResult.success) {
          throw new Error(
            contractResult.message || "Không thể tải danh sách người ở cùng.",
          );
        }

        const contract = unwrapData<ContractDetail>(contractResult.data);

        if (contract.status !== "ACTIVE") {
          setRoommates([]);
          setRoomNumber(null);
          setContractNumber(null);
          return;
        }

        // 5. Chỉ lấy người còn tham gia hợp đồng,
        // đồng thời loại chính người đang đăng nhập.
        const activeRoommates = (contract.contract_tenants ?? [])
          .filter(
            (tenant) =>
              tenant.status === "ACTIVE" &&
              String(tenant.profile_id) !== profileId &&
              tenant.profiles !== null,
          )
          .sort((a, b) => {
            if (a.role === b.role) return 0;
            return a.role === "REPRESENTATIVE" ? -1 : 1;
          });

        setRoommates(activeRoommates);
        setRoomNumber(contract.rooms?.room_number ?? null);
        setContractNumber(contract.contract_number ?? null);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi tải danh sách người ở cùng.",
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [session?.user?.id],
  );

  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (!session?.user?.id) {
      setLoading(false);
      setError("Vui lòng đăng nhập để xem thông tin người ở cùng.");
      return;
    }

    const controller = new AbortController();

    void fetchRoommates(controller.signal);

    return () => controller.abort();
  }, [session, sessionStatus, fetchRoommates]);

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Đang tải thông tin người ở cùng...
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10 mt-5">
      {/* HEADER */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
            <House size={16} />
            <Link href = "/tenant/dashboard" className="hover:underline hover:text-blue-600"><span>Xóm Cũ</span></Link>
            <ChevronRight size={14} />
            <span className="text-blue-600">Người ở cùng</span>
        </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Người ở cùng phòng
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thông tin cơ bản của những người đang cùng thuê phòng với bạn.
        </p>
      </div>

      {/* CURRENT CONTRACT */}
      {contractNumber && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <House className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Phòng hiện tại</p>
              <p className="font-semibold">{roomNumber ?? "—"}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Mã hợp đồng</p>
            <p className="font-medium">{contractNumber}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Số người ở cùng bạn</p>
            <p className="font-semibold">{roommates.length}</p>
          </div>
        </div>
      )}

      {/* ROOMMATES */}
      {!contractNumber ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <House className="mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="font-semibold">Bạn chưa có hợp đồng đang hiệu lực</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Danh sách người ở cùng sẽ xuất hiện khi bạn có hợp đồng thuê phòng
            đang hiệu lực.
          </p>
        </div>
      ) : roommates.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <Users className="mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="font-semibold">Hiện tại bạn chưa có người ở cùng</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bạn là người thuê duy nhất được ghi nhận trong hợp đồng hiện tại.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {roommates.map((roommate) => (
            <div key={roommate.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold">
                    {roommate.profiles?.full_name ?? "Người thuê"}
                  </h2>

                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      roommate.role === "REPRESENTATIVE"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {roommate.role === "REPRESENTATIVE"
                      ? "Người đại diện hợp đồng"
                      : "Thành viên"}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>Tham gia hợp đồng: {formatDate(roommate.joined_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Vì lý do bảo mật, trang này chỉ hiển thị tên, vai trò và ngày tham gia
        hợp đồng. Thông tin liên hệ và thông tin cá nhân riêng tư của người khác
        không được hiển thị.
      </p>
    </div>
  );
}
