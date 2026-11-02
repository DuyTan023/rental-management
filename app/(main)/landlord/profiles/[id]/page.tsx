"use client";

import {
  ArrowLeft,
  CalendarDays,
  CircleCheck,
  Clock,
  CreditCard,
  Loader2,
  LoaderCircle,
  Lock,
  Mail,
  MapPin,
  Phone,
  Unlock,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileWithUserV2 } from "@/lib/api/repositories/profiles/profiles.repository";
import {
  getProvinces,
  getWards,
  type Province,
  type Ward,
} from "@/lib/utils/administrative-units";
import { Decimal } from "@prisma/client/runtime/client";
import { toast } from "sonner";

const format = {
  serviceType: (type: string) => {
    const types: Record<string, string> = {
      METERED: "Theo chỉ số",
      FIXED_PER_MONTH: "Theo tháng",
      FIXED_PER_HEAD: "Theo đầu người",
    };

    return types[type] ?? type;
  },

  currency: (price: Decimal | number | string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(price));
  },

  date: (date: Date | string | null) => {
    if (!date) return "Chưa cập nhật";

    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  },
};

const accountStatusLabels: Record<string, string> = {
  ACTIVE: "Đã kích hoạt",
  INACTIVE: "Chưa kích hoạt",
  LOCKED: "Đã khóa",
};

function StatusBadge({
  status,
  labels,
}: {
  status: string;
  labels: Record<string, string>;
}) {
  const color =
    status === "ACTIVE" || status === "AVAILABLE"
      ? "bg-green-50 text-green-700 ring-green-600/20"
      : status === "OCCUPIED" || status === "EXPIRED" || status === "INACTIVE"
        ? "bg-orange-50 text-orange-700 ring-orange-600/20"
        : status === "LOCKED" ||
            status === "TERMINATED" ||
            status === "MAINTENANCE"
          ? "bg-red-50 text-red-700 ring-red-600/20"
          : "bg-gray-100 text-gray-700 ring-gray-500/20";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${color}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        {label}
      </p>
      <div className="mt-1.5 break-words font-medium text-gray-900">
        {value || "Chưa cập nhật"}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-gray-100 p-4 sm:p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>
        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export default function TenantProfileDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const profileId = params.id;

  const [profile, setProfile] = useState<ProfileWithUserV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [sendingActivation, setSendingActivation] = useState(false);

  type ConfirmAction = "ACTIVATE_EMAIL" | "LOCK" | "UNLOCK";

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  const [processingStatus, setProcessingStatus] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getProvinces()
      .then((data) => {
        if (!cancelled) setProvinces(data);
      })
      .catch((err) => console.error("Lỗi tải tỉnh/thành phố:", err));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!profileId) return;

    let cancelled = false;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/landlord/profiles/${encodeURIComponent(profileId)}`,
          { method: "GET", cache: "no-store" },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Không thể lấy thông tin người thuê.",
          );
        }

        if (!cancelled) {
          setProfile(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Đã xảy ra lỗi khi tải thông tin người thuê.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [profileId]);

  useEffect(() => {
    if (!profile?.province_code) {
      setWards([]);
      return;
    }

    let cancelled = false;

    getWards(Number(profile.province_code))
      .then((data) => {
        if (!cancelled) setWards(data);
      })
      .catch((err) => {
        console.error("Lỗi tải phường/xã:", err);
        if (!cancelled) setWards([]);
      });

    return () => {
      cancelled = true;
    };
  }, [profile?.province_code]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-gray-500">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        Đang tải thông tin người thuê...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-4 p-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error || "Không tìm thấy thông tin người thuê."}
        </div>
      </div>
    );
  }

  const provinceName =
    provinces.find((item) => item.code === Number(profile.province_code))
      ?.name ?? (profile.province_code ? "Chưa xác định" : "Chưa cập nhật");

  const wardName =
    wards.find((item) => item.code === Number(profile.ward_code))?.name ??
    (profile.ward_code ? "Chưa xác định" : "Chưa cập nhật");

  // Hợp đồng còn hiệu lực và người thuê vẫn đang tham gia.
  const activeTenantContracts = profile.contract_tenants.filter(
    (item) =>
      item.status === "ACTIVE" && item.rental_contracts?.status === "ACTIVE",
  );

  // Hiển thị toàn bộ hợp đồng được API trả về, bao gồm cả lịch sử.
  const contracts = [...profile.contract_tenants].sort(
    (a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime(),
  );

  const user = profile.users;

  const handleSendActivationEmail = async () => {
    if (!user?.id || sendingActivation) return;

    try {
      setSendingActivation(true);

      const response = await fetch("/api/auth/active-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Không thể gửi email kích hoạt tài khoản",
        );
      }

      toast.success(
        result.message || "Đã gửi email kích hoạt tài khoản thành công",
      );
    } catch (error) {
      console.error("Lỗi gửi email kích hoạt:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi gửi email kích hoạt",
      );
    } finally {
      setSendingActivation(false);
    }
  };

  const handleToggleAccountStatus = async () => {
    if (!user || processingStatus) return;

    const nextStatus = user.status === "ACTIVE" ? "LOCKED" : "ACTIVE";

    setProcessingStatus(true);

    try {
      const response = await fetch(`/api/landlord/profiles/user/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Không thể cập nhật trạng thái tài khoản",
        );
      }

      // Cập nhật trạng thái trên giao diện ngay sau khi API thành công.
      setProfile((prev) => {
        if (!prev || !prev.users) return prev;

        return {
          ...prev,
          users: {
            ...prev.users,
            status: nextStatus,
          },
        };
      });

      toast.success(
        nextStatus === "LOCKED"
          ? "Khóa tài khoản thành công"
          : "Mở khóa tài khoản thành công",
      );

      setConfirmAction(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi cập nhật tài khoản",
      );
    } finally {
      setProcessingStatus(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    if (confirmAction === "ACTIVATE_EMAIL") {
      await handleSendActivationEmail();
      setConfirmAction(null);
      return;
    }

    await handleToggleAccountStatus();
  };

  const confirmDialogContent = {
    ACTIVATE_EMAIL: {
      title: "Gửi thư kích hoạt?",
      description:
        "Bạn có chắc chắn muốn gửi email kích hoạt tài khoản đến người thuê này không?",
      confirmText: "Gửi thư kích hoạt",
    },
    LOCK: {
      title: "Khóa tài khoản?",
      description:
        "Người thuê sẽ không thể đăng nhập khi tài khoản bị khóa. Bạn có chắc chắn muốn tiếp tục?",
      confirmText: "Khóa tài khoản",
    },
    UNLOCK: {
      title: "Mở khóa tài khoản?",
      description:
        "Bạn có chắc chắn muốn mở khóa tài khoản này và cho phép người thuê đăng nhập trở lại?",
      confirmText: "Mở khóa tài khoản",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-5">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Tiêu đề */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/landlord/profiles"
              className="mb-2 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Danh sách người thuê
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Chi tiết người thuê
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Thông tin cá nhân, tài khoản, phòng ở và lịch sử hợp đồng.
            </p>
          </div>
        </div>

        {/* Hồ sơ tổng quan */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`Ảnh đại diện ${profile.full_name}`}
                  className="h-20 w-20 shrink-0 rounded-full border-2 border-gray-100 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                  {profile.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}

              <div className="min-w-0">
                <h2 className="break-words text-xl font-bold text-gray-900">
                  {profile.full_name}
                </h2>
                <p className="mt-1 break-all text-sm text-gray-500">
                  {user?.email ?? "Chưa liên kết tài khoản"}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {user ? (
                    <StatusBadge
                      status={user.status}
                      labels={accountStatusLabels}
                    />
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                      Chưa liên kết tài khoản
                    </span>
                  )}

                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {user?.role === "TENANT"
                      ? "Người thuê"
                      : user?.role === "LANDLORD"
                        ? "Chủ trọ"
                        : "Chưa xác định vai trò"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="rounded-xl bg-blue-50 p-3">
                <p className="text-xs text-blue-700">Hợp đồng đang thuê</p>
                <Link
                  href={`/landlord/rental_contracts/${profile.contract_tenants[0].rental_contracts.id}`}
                  className="hover:underline decoration-blue-600"
                >
                  <p className="mt-1 text-2xl font-bold text-blue-900">
                    {
                      profile.contract_tenants[0].rental_contracts
                        .contract_number
                    }
                  </p>
                </Link>
              </div>
              <div className="rounded-xl bg-violet-50 p-3">
                <p className="text-xs text-violet-500">Phòng đang ở</p>
                <Link
                  href={`/landlord/rooms/${profile.contract_tenants[0].rental_contracts.rooms.id}`}
                  className="hover:underline decoration-violet-600"
                >
                  <p className="mt-1 text-2xl font-bold text-violet-900">
                    {
                      profile.contract_tenants[0].rental_contracts.rooms
                        .room_number
                    }
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Thông tin cá nhân */}
        <SectionCard
          title="Thông tin cá nhân"
          description="Thông tin định danh và liên hệ của người thuê."
          icon={<UserRound className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Họ và tên" value={profile.full_name} />
            <InfoItem
              label="Số điện thoại"
              icon={<Phone className="h-4 w-4" />}
              value={profile.phone || "Chưa cập nhật"}
            />
            <InfoItem
              label="Số CCCD"
              icon={<CreditCard className="h-4 w-4" />}
              value={profile.identity_number || "Chưa cập nhật"}
            />
            <InfoItem
              label="Ngày sinh"
              icon={<CalendarDays className="h-4 w-4" />}
              value={format.date(profile.date_of_birth)}
            />
            <InfoItem
              label="Email"
              icon={<Mail className="h-4 w-4" />}
              value={user?.email || "Chưa cập nhật"}
            />
            <InfoItem label="ID hồ sơ" value={String(profile.id)} />
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <h3 className="mb-4 font-semibold text-gray-900">
              Địa chỉ liên hệ
            </h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <InfoItem
                label="Tỉnh / Thành phố"
                icon={<MapPin className="h-4 w-4" />}
                value={provinceName}
              />
              <InfoItem label="Phường / Xã" value={wardName} />
              <div className="sm:col-span-2">
                <InfoItem
                  label="Địa chỉ chi tiết"
                  value={profile.address_detail || "Chưa cập nhật"}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Thông tin tài khoản */}
        <SectionCard
          title="Thông tin tài khoản"
          description="Trạng thái và hoạt động của tài khoản liên kết."
          icon={<Mail className="h-5 w-5" />}
        >
          {!user ? (
            <p className="text-sm text-gray-500">
              Hồ sơ này chưa liên kết với tài khoản người dùng.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem label="Email đăng nhập" value={user.email} />

                <InfoItem
                  label="Vai trò"
                  value={
                    user.role === "TENANT"
                      ? "Người thuê"
                      : user.role === "LANDLORD"
                        ? "Chủ trọ"
                        : user.role
                  }
                />

                <InfoItem
                  label="Trạng thái tài khoản"
                  value={
                    <StatusBadge
                      status={user.status}
                      labels={accountStatusLabels}
                    />
                  }
                />

                <InfoItem
                  label="Ngày kích hoạt"
                  icon={<CircleCheck className="h-4 w-4" />}
                  value={format.date(user.activated_at)}
                />

                <InfoItem
                  label="Đăng nhập gần nhất"
                  icon={<Clock className="h-4 w-4" />}
                  value={format.date(user.last_login_at)}
                />

                <InfoItem
                  label="Ngày tạo tài khoản"
                  value={format.date(user.created_at)}
                />
              </div>

              {/* Thao tác tài khoản */}
              <div className="flex justify-end border-t pt-4">
                {user.status === "ACTIVE" ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setConfirmAction("LOCK")}
                    disabled={processingStatus}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Khóa tài khoản
                  </Button>
                ) : user.status === "INACTIVE" ? (
                  <Button
                    type="button"
                    onClick={() => setConfirmAction("ACTIVATE_EMAIL")}
                    disabled={sendingActivation}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Gửi thư kích hoạt
                  </Button>
                ) : user.status === "LOCKED" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmAction("UNLOCK")}
                    disabled={processingStatus}
                  >
                    <Unlock className="mr-2 h-4 w-4" />
                    Mở khóa tài khoản
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </SectionCard>

        <p className="pb-3 text-center text-xs text-gray-400">
          Thông tin được hiển thị từ hồ sơ người thuê và dữ liệu liên kết trong
          hệ thống.
        </p>
      </div>

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open && !processingStatus && !sendingActivation) {
            setConfirmAction(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction
                ? confirmDialogContent[confirmAction].title
                : "Xác nhận thao tác"}
            </DialogTitle>

            <DialogDescription>
              {confirmAction
                ? confirmDialogContent[confirmAction].description
                : ""}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={processingStatus || sendingActivation}
            >
              Hủy
            </Button>

            <Button
              type="button"
              variant={confirmAction === "LOCK" ? "destructive" : "default"}
              onClick={handleConfirmAction}
              disabled={processingStatus || sendingActivation}
            >
              {processingStatus || sendingActivation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : confirmAction ? (
                confirmDialogContent[confirmAction].confirmText
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
