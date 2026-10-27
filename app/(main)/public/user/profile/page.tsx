"use client";

import { UpdatePasswordDialog } from "@/app/public/auth/update-password/UpadtePassword";
import type { profiles } from "@/generated/prisma/client";
import {
  getProvinces,
  getWards,
  type Province,
  type Ward,
} from "@/lib/utils/administrative-units";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Profile() {
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<profiles | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // 1. Lấy danh sách tỉnh/thành phố
  useEffect(() => {
    getProvinces()
      .then(setProvinces)
      .catch((err) => {
        console.error("Lỗi lấy tỉnh/thành phố:", err);
      });
  }, []);

  // 2. Lấy profile theo user_id sau khi đăng nhập
  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated" || !session?.user?.id) {
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        setError(null);

        const response = await fetch(
          `/api/landlord/profiles/user/${encodeURIComponent(session.user.id)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Không thể lấy thông tin cá nhân.");
        }

        if (!cancelled) {
          setProfile(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Đã xảy ra lỗi khi lấy thông tin cá nhân.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, status]);

  // 3. Khi đã có profile, lấy danh sách phường/xã của tỉnh tương ứng
  useEffect(() => {
    if (!profile?.province_code) {
      return;
    }

    let cancelled = false;

    getWards(Number(profile.province_code))
      .then((data) => {
        if (!cancelled) {
          setWards(data);
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy phường/xã:", err);

        if (!cancelled) {
          setWards([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [profile?.province_code]);

  if (status === "loading" || loadingProfile) {
    return <div>Đang tải thông tin...</div>;
  }

  if (status === "unauthenticated" || !session?.user?.id) {
    return (
      <div className="p-4 text-red-500">
        Vui lòng đăng nhập để xem thông tin cá nhân.
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!profile) {
    return <div>Không tìm thấy thông tin cá nhân.</div>;
  }

  // 4. Tìm tên tỉnh/thành phố theo mã lưu trong profile
  const provinceName =
    provinces.find(
      (province) => province.code === Number(profile.province_code),
    )?.name ?? "Chưa xác định";

  // 5. Tìm tên phường/xã theo mã lưu trong profile
  const wardName =
    wards.find((ward) => ward.code === Number(profile.ward_code))?.name ??
    "Chưa xác định";
  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-5">
      <div className="mx-auto space-y-2">
        {/* Tiêu đề */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Hồ sơ cá nhân
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Thông tin tài khoản và thông tin cá nhân của bạn.
          </p>
        </div>

        {/* Thẻ thông tin cá nhân */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Phần đầu hồ sơ */}
          <div className="flex flex-col gap-3 border-b border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Ảnh đại diện"
                  className="h-16 w-16 rounded-full border-2 border-gray-100 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                  {profile.full_name.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {profile.full_name}
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  {session?.user?.email ?? "Chưa cập nhật email"}
                </p>

                <span className="mt-1.5 inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Tài khoản của tôi
                </span>
              </div>
            </div>

            {/* Nút thay đổi mật khẩu */}
            <UpdatePasswordDialog />
          </div>

          {/* Thông tin cá nhân */}
          <div className="p-3 sm:p-5">
            <h3 className="mb-4 text-base font-bold text-gray-900">
              Thông tin cá nhân
            </h3>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Họ và tên</p>
                <p className="mt-1 font-medium text-gray-900">
                  {profile.full_name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Địa chỉ email</p>
                <p className="mt-1 break-words font-medium text-gray-900">
                  {session?.user?.email ?? "Chưa cập nhật"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Số điện thoại</p>
                <p className="mt-1 font-medium text-gray-900">
                  {profile.phone || "Chưa cập nhật"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Số CCCD</p>
                <p className="mt-1 font-medium text-gray-900">
                  {profile.identity_number || "Chưa cập nhật"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Ngày sinh</p>
                <p className="mt-1 font-medium text-gray-900">
                  {profile.date_of_birth
                    ? new Date(profile.date_of_birth).toLocaleDateString(
                        "vi-VN",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        },
                      )
                    : "Chưa cập nhật"}
                </p>
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="mt-3 border-t border-gray-100 pt-3">
              <h3 className="mb-4 text-base font-bold text-gray-900">
                Địa chỉ liên hệ
              </h3>

              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Tỉnh / Thành phố</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {provinceName}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Phường / Xã</p>
                  <p className="mt-1 font-medium text-gray-900">{wardName}</p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500">Địa chỉ chi tiết</p>
                  <p className="mt-1 leading-5 text-gray-900">
                    {profile.address_detail || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Thông tin cá nhân được hiển thị từ hồ sơ tài khoản của bạn.
        </p>
      </div>
    </div>
  );
}
