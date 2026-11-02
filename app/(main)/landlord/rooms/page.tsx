
"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  CardSim,
  Clock,
  House,
  Search,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";

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

  // Tìm kiếm phòng
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");

  // =========================
  // LẤY DANH SÁCH PHÒNG
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
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (appliedKeyword) {
          params.set("keyword", appliedKeyword);
        }

        const response = await fetch(
          `/api/landlord/rooms?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Không thể lấy danh sách phòng");
        }

        const result: ApiResponse<
          PaginationResult<RoomWithCurrentContract>
        > = await response.json();

        if (!result.success || !result.data) {
          throw new Error(
            result.message || "Lấy danh sách phòng thất bại",
          );
        }

        allRooms.push(...result.data.data);

        totalPage = result.data.totalPage;
        page++;
      } while (page <= totalPage);

      setRooms(allRooms);
    } catch (err) {
      console.error("Lỗi lấy danh sách phòng:", err);

      setRooms([]);

      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi lấy danh sách phòng",
      );
    } finally {
      setLoading(false);
    }
  }, [appliedKeyword]);

  // Gọi API khi mở trang hoặc khi từ khóa tìm kiếm thay đổi
  useEffect(() => {
    void getAllRoom();
  }, [getAllRoom]);

  // =========================
  // XỬ LÝ TÌM KIẾM
  // =========================

  const handleSearch = () => {
    setAppliedKeyword(keyword.trim());
  };

  const handleResetSearch = () => {
    setKeyword("");
    setAppliedKeyword("");
  };

  // =========================
  // TÍNH SỐ LƯỢNG PHÒNG
  // =========================

  const totalRooms = rooms.length;

  const emptyRooms = rooms.filter(
    (room) => room.status === "AVAILABLE",
  ).length;

  const rentingRooms = rooms.filter(
    (room) => room.current_contract !== null,
  ).length;

  const repairingRooms = rooms.filter(
    (room) => room.status === "MAINTENANCE",
  ).length;

  const warningRooms = rooms.filter(
    (room) => room.status === "INACTIVE",
  ).length;

  // =========================
  // CẤU HÌNH CÁC TAB
  // =========================

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
        "data-active:ring-2 data-active:ring-orange-500 data-active:border-orange-500 data-active:bg-orange-100",
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
        "data-active:ring-2 data-active:ring-violet-500 data-active:border-violet-500 data-active:bg-violet-100",
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
        "data-active:ring-2 data-active:ring-red-500 data-active:border-red-500 data-active:bg-red-100",
    },
  ] as const;

  const tabComponents = {
    total: Total,
    empty: Empty,
    renting: Renting,
    repairing: Repairing,
    warning: Warning,
  };

  // =========================
  // GIAO DIỆN
  // =========================

  return (
    <div className="flex flex-col gap-y-4 p-3 sm:p-4 md:p-5">
      <div className="flex flex-col gap-y-4">
        {/* Tiêu đề */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-black md:text-xl">
            Xin Chào, Kẻ thống trị
          </h1>

          <FormCreateRoom
            onSuccess={() => {
              void getAllRoom();
            }}
            trigger={
              <Button className="bg-blue-600 font-bold text-white hover:bg-blue-500">
                + Thêm phòng
              </Button>
            }
          />
        </div>

        {/* Thanh tìm kiếm */}
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm kiếm theo mã phòng..."
              className="h-10 bg-white pl-9"
            />
          </div>

          <Button
            type="submit"
            className="h-10 bg-blue-600 font-bold text-white hover:bg-blue-500"
          >
            <Search className="mr-2 size-4" />
            Tìm kiếm
          </Button>

          {(keyword || appliedKeyword) && (
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={handleResetSearch}
            >
              <X className="mr-2 size-4" />
              Xóa tìm kiếm
            </Button>
          )}
        </form>

        {/* Các thẻ thống kê và danh sách phòng */}
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
                    flex cursor-pointer items-center gap-2 rounded-xl
                    border border-transparent p-2
                    transition-all duration-200
                    data-selected:bg-white
                    data-[state=active]:bg-white
                    data-selected:shadow-md
                    data-[state=active]:shadow-md
                    data-selected:scale-[1.02]
                    data-[state=active]:scale-[1.02]
                  `}
                >
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
                  >
                    <Icon size={18} className={item.textColor} />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col items-start">
                    <p className="truncate text-[10px] text-gray-700 sm:text-xs">
                      {item.title}
                    </p>

                    <p className="text-lg font-bold leading-5">
                      {item.value}
                    </p>
                  </div>

                  <p className={`shrink-0 text-[9px] ${item.detailColor}`}>
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
                  <div className="rounded-xl border bg-white p-6 text-center text-sm text-red-600">
                    {error}
                  </div>
                ) : (
                  <TabComponent
                    rooms={rooms}
                    loading={loading}
                    error={error}
                  />
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
