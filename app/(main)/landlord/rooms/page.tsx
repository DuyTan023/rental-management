"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CardSim, Clock, House, UsersRound, Wallet } from "lucide-react";

import type { RoomWithCurrentContract } from "@/lib/api/repositories/rooms/rooms.repository";
import type { ApiResponse, PaginationResult } from "@/lib/types/api.type";

import Empty from "@/lib/components/landlord/rooms/Empty";
import { FormCreateRoom } from "@/lib/components/landlord/rooms/FormCreateRoom";
import Renting from "@/lib/components/landlord/rooms/Renting";
import Repairing from "@/lib/components/landlord/rooms/Repairing";
import Total from "@/lib/components/landlord/rooms/Total";
import Warning from "@/lib/components/landlord/rooms/Warning";

export default function Rooms() {
  const [rooms, setRooms] = useState<RoomWithCurrentContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("total");

  // =========================
  // LẤY TẤT CẢ PHÒNG
  // =========================

  const getAllRoom = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const limit = 100;
      let page = 1;
      let totalPage = 1;

      const allRooms: RoomWithCurrentContract[] = [];

      do {
        const response = await fetch(
          `/api/landlord/rooms?page=${page}&limit=${limit}`,
        );

        if (!response.ok) {
          throw new Error("Không thể lấy danh sách phòng");
        }

        const result: ApiResponse<PaginationResult<RoomWithCurrentContract>> =
          await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.message || "Lấy danh sách phòng thất bại");
        }

        allRooms.push(...result.data.data);

        totalPage = result.data.totalPage;
        page++;
      } while (page <= totalPage);

      setRooms(allRooms);
    } catch (err) {
      console.error("Lỗi lấy danh sách phòng:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi lấy danh sách phòng",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Gọi API khi component được mount
  useEffect(() => {
    void getAllRoom();
  }, [getAllRoom]);

  // =========================
  // TÍNH SỐ LƯỢNG PHÒNG
  // =========================

  const totalRooms = rooms.length; // Tổng số lượng phòng

  const emptyRooms = rooms.filter(
    // Phòng trống
    (room) => room.status === "AVAILABLE",
  ).length;

  const rentingRooms = rooms.filter(
    // Phòng đang có người thuê (Phòng có ng thuê khác null) có thể tìm theo trạng thái
    (room) => room.current_contract !== null,
  ).length;

  const repairingRooms = rooms.filter(
    // Phòng đang sử chữa bảo trì
    (room) => room.status === "MAINTENANCE",
  ).length;

  // Tạm thời chưa xác định quy tắc cảnh báo từ nghiệp vụ.
  const warningRooms = rooms.filter(
    // Phòng đang có người thuê
    (room) => room.status === "INACTIVE",
  ).length;
  const itemTabs = [
    {
      id: "total",
      icon: House,
      title: "Tổng số phòng",
      value: totalRooms,
      cardBg: "bg-blue-50 hover:bg-blue-100",
      iconBg: "bg-blue-200",
      textColor: "text-blue-600",
      detailColor: "text-blue-500",
      // Sử dụng data-active thay vì data-selected
      activeRing:
        "data-active:ring-2 data-active:ring-blue-500 data-active:border-blue-500 data-active:bg-blue-100",
    },
    {
      id: "empty",
      icon: UsersRound,
      title: "Phòng trống",
      value: emptyRooms,
      cardBg: "bg-green-50 hover:bg-green-100",
      iconBg: "bg-green-200",
      textColor: "text-green-600",
      detailColor: "text-green-500",
      activeRing:
        "data-active:ring-2 data-active:ring-green-500 data-active:border-green-500 data-active:bg-green-100",
    },
    {
      id: "renting",
      icon: Wallet,
      title: "Đang cho thuê",
      value: rentingRooms,
      cardBg: "bg-orange-50 hover:bg-orange-100",
      iconBg: "bg-orange-200",
      textColor: "text-orange-600",
      detailColor: "text-orange-500",
      activeRing:
        "data-active:ring-2 data-active:ring-orange-500 data-active:border-orange-500, data-active:bg-orange-100",
    },
    {
      id: "repairing",
      icon: CardSim,
      title: "Đang sửa chữa",
      value: repairingRooms,
      cardBg: "bg-violet-50 hover:bg-violet-100",
      iconBg: "bg-violet-200",
      textColor: "text-violet-600",
      detailColor: "text-violet-500",
      activeRing:
        "data-active:ring-2 data-active:ring-violet-500 data-active:border-violet-500, data-active:bg-violet-100",
    },
    {
      id: "warning",
      icon: Clock,
      title: "Ngừng hoạt động",
      value: warningRooms,
      cardBg: "bg-red-50 hover:bg-red-100",
      iconBg: "bg-red-200",
      textColor: "text-red-600",
      detailColor: "text-red-500",
      activeRing:
        "data-active:ring-2 data-active:ring-red-500 data-active:border-red-500, data-active:bg-red-100",
    },
  ] as const;

  const tabComponents = {
    total: Total,
    empty: Empty,
    renting: Renting,
    repairing: Repairing,
    warning: Warning,
  };

  return (
    <div className="flex flex-col p-3 sm:p-4 md:p-5 gap-y-4">
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-black text-lg md:text-xl font-bold">
            Xin Chào, Kẻ thống trị
          </h1>
          <FormCreateRoom
            onSuccess={() => {
              void getAllRoom();
            }}
            trigger={
              <Button className="bg-blue-600 text-white font-bold hover:bg-blue-500">
                + Thêm phòng
              </Button>
            }
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex w-full flex-col gap-4"
        >
          <TabsList className="grid h-auto w-full grid-cols-2 items-stretch gap-2 bg-transparent p-0 md:grid-cols-5">
            {itemTabs.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className={`
                    ${item.cardBg} ${item.activeRing}
                    flex items-center rounded-xl border border-transparent p-2 gap-2
                    transition-all duration-200 cursor-pointer
                    data-selected:bg-white data-[state=active]:bg-white
                    data-selected:shadow-md data-[state=active]:shadow-md
                    data-selected:scale-[1.02] data-[state=active]:scale-[1.02]
                  `}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 ${item.iconBg}`}
                  >
                    <Icon size={18} className={item.textColor} />
                  </div>

                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-700 truncate">
                      {item.title}
                    </p>
                    <p className="font-bold text-lg leading-5">
                      {item.value.toString()}
                    </p>
                  </div>
                  <p className={`text-[9px] shrink-0 ${item.detailColor}`}>
                    Chi tiết
                  </p>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Nội dung từng tab */}
          {itemTabs.map((item) => {
            const TabComponent =
              tabComponents[item.id as keyof typeof tabComponents];

            return (
              <TabsContent
                key={item.id}
                value={item.id}
                className="mt-2 w-full min-w-0"
              >
                {loading ? (
                  <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-500">
                    Đang tải dữ liệu...
                  </div>
                ) : error ? (
                  <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-500">
                    Không thể hiển thị danh sách phòng.
                  </div>
                ) : (
                  <TabComponent rooms={rooms} loading={loading} error={error} />
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
