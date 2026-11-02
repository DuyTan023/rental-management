
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UserRound,
  Mail,
  Phone,
  CreditCard,
  CalendarDays,
  MapPin,
  House,
  FileText,
  Users,
  Clock,
  CircleCheck,
  CircleX,
  LoaderCircle,
  Lock,
  Loader2,
} from "lucide-react";

import {
  getProvinces,
  getWards,
  type Province,
  type Ward,
} from "@/lib/utils/administrative-units";
import { ProfileWithUserV2 } from "@/lib/api/repositories/profiles/profiles.repository";
import { Decimal } from "@prisma/client/runtime/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


const formatDate = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatMoney = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") {
    return "Chưa cập nhật";
  }

  return `${Number(value).toLocaleString("vi-VN")} đ`;
};

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

const roomStatusLabels: Record<string, string> = {
  AVAILABLE: "Phòng trống",
  OCCUPIED: "Đang cho thuê",
  MAINTENANCE: "Đang sửa chữa",
  INACTIVE: "Ngừng hoạt động",
};

const contractStatusLabels: Record<string, string> = {
  DRAFT: "Bản nháp",
  ACTIVE: "Đang hiệu lực",
  EXPIRED: "Đã hết hạn",
  TERMINATED: "Đã chấm dứt",
  COMPLETED: "Đã hoàn thành",
};

const accountStatusLabels: Record<string, string> = {
  ACTIVE: "Đã kích hoạt",
  INACTIVE: "Chưa kích hoạt",
  LOCKED: "Đã khóa",
};

const tenantRoleLabels: Record<string, string> = {
  REPRESENTATIVE: "Người đại diện hợp đồng",
  MEMBER: "Thành viên hợp đồng",
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
      : status === "OCCUPIED" ||
          status === "EXPIRED" ||
          status === "INACTIVE"
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
    provinces.find(
      (item) => item.code === Number(profile.province_code),
    )?.name ?? (profile.province_code ? "Chưa xác định" : "Chưa cập nhật");

  const wardName =
    wards.find((item) => item.code === Number(profile.ward_code))?.name ??
    (profile.ward_code ? "Chưa xác định" : "Chưa cập nhật");

  // Hợp đồng còn hiệu lực và người thuê vẫn đang tham gia.
  const activeTenantContracts = profile.contract_tenants.filter(
    (item) =>
      item.status === "ACTIVE" &&
      item.rental_contracts?.status === "ACTIVE",
  );

  // Hiển thị toàn bộ hợp đồng được API trả về, bao gồm cả lịch sử.
  const contracts = [...profile.contract_tenants].sort(
    (a, b) =>
      new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime(),
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
                <Link href={`/landlord/rental_contracts/${profile.contract_tenants[0].rental_contracts.id}`} className="hover:underline decoration-blue-600">
                    <p className="mt-1 text-2xl font-bold text-blue-900">
                        {profile.contract_tenants[0].rental_contracts.contract_number}
                    </p>
                </Link>
                
              </div>
              <div className="rounded-xl bg-violet-50 p-3">
                <p className="text-xs text-violet-500">Phòng đang ở</p>
                <Link href={`/landlord/rooms/${profile.contract_tenants[0].rental_contracts.rooms.id}`} className="hover:underline decoration-violet-600">
                <p className="mt-1 text-2xl font-bold text-violet-900">
                  {profile.contract_tenants[0].rental_contracts.rooms.room_number}
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
            <InfoItem
              label="ID hồ sơ"
              value={String(profile.id)}
            />
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
              <InfoItem
                label="Phường / Xã"
                value={wardName}
              />
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
            // onClick={handleLockAccount}
          >
            <Lock className="mr-2 h-4 w-4" />
            Khóa tài khoản
          </Button>
        ) : user.status === "INACTIVE" ? (
          <Button
            type="button"
            onClick={handleSendActivationEmail}
            disabled={sendingActivation}
          >
            {sendingActivation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Gửi thư kích hoạt
              </>
            )}
          </Button>
        ) : null}
      </div>
      </div>
    )}
    </SectionCard>

        {/* Phòng đang ở */}
        {/* <SectionCard
          title="Phòng đang ở"
          description="Phòng gắn với các hợp đồng đang có hiệu lực của người thuê."
          icon={<House className="h-5 w-5" />}
        >
          {activeTenantContracts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center">
              <House className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-3 font-medium text-gray-700">
                Người thuê hiện không có hợp đồng đang hiệu lực
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Khi có hợp đồng đang hiệu lực, thông tin phòng sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {activeTenantContracts.map((tenantContract) => {
                const contract = tenantContract.rental_contracts;
                const room = contract.rooms;

                return (
                  <div
                    key={String(tenantContract.id)}
                    className="rounded-xl border border-gray-200 p-4 transition hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Số phòng</p>
                        <h3 className="mt-1 text-xl font-bold text-gray-900">
                          {room.room_number ?? "Chưa có thông tin phòng"}
                        </h3>
                      </div>
                      {room?.status && (
                        <StatusBadge
                          status={room.status}
                          labels={roomStatusLabels}
                        />
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <InfoItem
                        label="Diện tích"
                        value={room ? `${room.area} m²` : "Chưa cập nhật"}
                      />
                      <InfoItem
                        label="Sức chứa tối đa"
                        value={
                          room ? `${room.max_occupants} người` : "Chưa cập nhật"
                        }
                      />
                      <InfoItem
                        label="Giá thuê theo hợp đồng"
                        value={format.currency(contract.rent_price)}
                      />
                      <InfoItem
                        label="Giá niêm yết"
                        value={format.currency(room?.listed_rent)}
                      />
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="text-sm text-gray-500">Mã hợp đồng</p>
                      <p className="mt-1 font-semibold text-blue-700">
                        {contract.contract_number}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {format.date(contract.start_date)} –{" "}
                        {format.date(contract.end_date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard> */}

        {/* Danh sách hợp đồng */}
        {/* <SectionCard
          title="Hợp đồng thuê"
          description="Danh sách các hợp đồng mà người thuê tham gia, bao gồm cả lịch sử."
          icon={<FileText className="h-5 w-5" />}
        >
          {contracts.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-3 text-sm text-gray-500">
                Người thuê chưa có hợp đồng nào.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contracts.map((tenantContract) => {
                const contract = tenantContract.rental_contracts;
                const room = contract.rooms;

                return (
                  <div
                    key={String(tenantContract.id)}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {contract.contract_number}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Phòng {room?.room_number ?? "Chưa xác định"}
                        </p>
                      </div>
                      <StatusBadge
                        status={contract.status}
                        labels={contractStatusLabels}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoItem
                        label="Ngày bắt đầu"
                        value={format.date(contract.start_date)}
                      />
                      <InfoItem
                        label="Ngày kết thúc"
                        value={format.date(contract.end_date)}
                      />
                      <InfoItem
                        label="Giá thuê"
                        value={format.currency(contract.rent_price)}
                      />
                      <InfoItem
                        label="Ngày thanh toán"
                        value={`Ngày ${contract.billing_day} hằng tháng`}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
                      <InfoItem
                        label="Vai trò trong hợp đồng"
                        value={
                          tenantRoleLabels[tenantContract.role] ??
                          tenantContract.role
                        }
                      />
                      <InfoItem
                        label="Trạng thái tham gia"
                        value={
                          tenantContract.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                              <CircleCheck className="h-4 w-4" />
                              Đang tham gia
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600">
                              <CircleX className="h-4 w-4" />
                              {tenantContract.status}
                            </span>
                          )
                        }
                      />
                      <InfoItem
                        label="Ngày tham gia"
                        value={format.date(tenantContract.joined_at)}
                      />
                      <InfoItem
                        label="Ngày rời hợp đồng"
                        value={format.date(tenantContract.left_at)}
                      />
                    </div>

                    {tenantContract.left_reason && (
                      <div className="mt-4 rounded-lg bg-gray-50 p-3">
                        <p className="text-sm text-gray-500">
                          Lý do rời hợp đồng
                        </p>
                        <p className="mt-1 text-sm text-gray-800">
                          {tenantContract.left_reason}
                        </p>
                      </div>
                    )}

                    {contract.note && (
                      <div className="mt-4 rounded-lg bg-gray-50 p-3">
                        <p className="text-sm text-gray-500">Ghi chú hợp đồng</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                          {contract.note}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard> */}

        {/* Thông tin bổ sung */}
        {/* <SectionCard
          title="Thông tin bổ sung"
          description="Thông tin phục vụ việc quản lý người thuê."
          icon={<Users className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoItem
              label="Số hợp đồng đã tham gia"
              value={`${contracts.length} hợp đồng`}
            />
            <InfoItem
              label="Số hợp đồng đang hiệu lực"
              value={`${activeTenantContracts.length} hợp đồng`}
            />
          </div>
        </SectionCard> */}

        <p className="pb-3 text-center text-xs text-gray-400">
          Thông tin được hiển thị từ hồ sơ người thuê và dữ liệu liên kết trong hệ thống.
        </p>
      </div>
    </div>
  );
}
