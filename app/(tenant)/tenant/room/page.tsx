
"use client";

import type { ProfileWithUserV2 } from "@/lib/api/repositories/profiles/profiles.repository";
import type { RoomWithCurrentContract } from "@/lib/api/repositories/rooms/rooms.repository";
import type { TenantCurrentMeterReading } from "@/lib/types/room.type";
import type { ApiResponse } from "@/lib/types/api.type";

import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import TenantRoomDetail from "@/lib/components/tenant/rooms/RoomDetail";

type CurrentReadingsResponse = {
  roomId: string;
  contractId: string;
  readings: TenantCurrentMeterReading[];
};

export default function ProfileDetail() {
  const { data: session, status } = useSession();

  const [profile, setProfile] =
    useState<ProfileWithUserV2 | null>(null);

  const [room, setRoom] =
    useState<RoomWithCurrentContract | null>(null);

  const [currentReadings, setCurrentReadings] = useState<
    TenantCurrentMeterReading[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    const controller = new AbortController();

    // Xóa dữ liệu cũ khi phiên đăng nhập thay đổi
    setProfile(null);
    setRoom(null);
    setCurrentReadings([]);
    setError(null);

    if (status !== "authenticated" || !session?.user?.id) {
      setLoading(false);
      setError("Vui lòng đăng nhập để xem thông tin.");
      return () => controller.abort();
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Lấy profile ID theo user ID
        const userId = encodeURIComponent(session.user.id);

        const profileIdRes = await fetch(
          `/api/landlord/profiles/user/${userId}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const profileIdResult = await profileIdRes.json();

        if (!profileIdRes.ok || !profileIdResult.data?.id) {
          throw new Error(
            profileIdResult.message || "Không tìm thấy hồ sơ cá nhân."
          );
        }

        const profileId = encodeURIComponent(
          String(profileIdResult.data.id)
        );

        // 2. Lấy profile
        const profileRes = await fetch(
          `/api/landlord/profiles/${profileId}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const profileResult: ApiResponse<ProfileWithUserV2> =
          await profileRes.json();

        if (!profileRes.ok || !profileResult.data) {
          throw new Error(
            profileResult.message || "Không thể lấy thông tin người thuê."
          );
        }

        const currentProfile = profileResult.data;

        // 3. Lấy phòng từ hợp đồng
        // Giữ cách lấy hợp đồng đầu tiên như code hiện tại
        const roomId =
          currentProfile.contract_tenants?.[0]
            ?.rental_contracts?.rooms?.id;

        if (roomId == null) {
          if (!controller.signal.aborted) {
            setProfile(currentProfile);
          }
          return;
        }

        const encodedRoomId = encodeURIComponent(String(roomId));

        // 4. Lấy phòng và chỉ số điện nước song song
        const [roomRes, readingsRes] = await Promise.all([
          fetch(`/api/landlord/rooms/${encodedRoomId}`, {
            cache: "no-store",
            signal: controller.signal,
          }),

          fetch(
            `/api/landlord/rooms/${encodedRoomId}/meter_readings`,
            {
              cache: "no-store",
              signal: controller.signal,
            }
          ),
        ]);

        if (!roomRes.ok) {
          throw new Error("Không thể lấy thông tin phòng.");
        }

        const roomResult: ApiResponse<RoomWithCurrentContract> =
          await roomRes.json();

        if (!roomResult.data) {
          throw new Error("Không tìm thấy thông tin phòng.");
        }

        let readings: TenantCurrentMeterReading[] = [];

        if (readingsRes.ok) {
          const readingsResult: ApiResponse<CurrentReadingsResponse> =
            await readingsRes.json();

          readings = readingsResult.data?.readings ?? [];
        }

        if (!controller.signal.aborted) {
          setProfile(currentProfile);
          setRoom(roomResult.data);
          setCurrentReadings(readings);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi tải dữ liệu."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, [session?.user?.id, status]);

  // Loading
  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-gray-500">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        Đang tải thông tin phòng...
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="space-y-4 p-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  // Không tìm thấy profile
  if (!profile) {
    return (
      <div className="p-8 text-center text-slate-500">
        Không tìm thấy thông tin người thuê.
      </div>
    );
  }

  // Chưa có phòng thuê
  if (!room) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
        <p className="font-medium text-slate-700">
          Bạn chưa có phòng thuê
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Hiện tại chưa tìm thấy phòng thuê được liên kết.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-7 md:py-8">
      <div className="mx-auto max-w-7xl space-y-8">
      <TenantRoomDetail
        room={room}
        currentReadings={currentReadings}
      />
      </div>
    </main>
  );
}
