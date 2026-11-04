"use client";

import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Droplets,
  Eye,
  Search,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type ReadingStatus = "PENDING" | "APPROVED" | "REJECTED";

type Reading = {
  value: number;
  status: ReadingStatus;
};

type RoomReading = {
  id: number;
  roomNumber: string;
  tenant: string;
  electricity?: Reading;
  water?: Reading;
};

const mockRooms: RoomReading[] = [
  {
    id: 1,
    roomNumber: "P101",
    tenant: "Nguyễn Văn An",
    electricity: { value: 1250, status: "PENDING" },
    water: { value: 320, status: "PENDING" },
  },
  {
    id: 2,
    roomNumber: "P102",
    tenant: "Trần Thị Bình",
    electricity: { value: 980, status: "APPROVED" },
    water: { value: 215, status: "PENDING" },
  },
  {
    id: 3,
    roomNumber: "P103",
    tenant: "Lê Văn Cường",
    electricity: { value: 1560, status: "PENDING" },
  },
  {
    id: 4,
    roomNumber: "P104",
    tenant: "Phạm Thị Dung",
  },
  {
    id: 5,
    roomNumber: "P105",
    tenant: "Hoàng Văn Minh",
    electricity: { value: 870, status: "REJECTED" },
    water: { value: 190, status: "APPROVED" },
  },
  {
    id: 6,
    roomNumber: "P106",
    tenant: "Đỗ Thị Hoa",
    electricity: { value: 1100, status: "APPROVED" },
    water: { value: 260, status: "APPROVED" },
  },
];

type Filter = "ALL" | "COMPLETE" | "PARTIAL" | "MISSING";

function getRoomStatus(room: RoomReading): Filter {
  if (!room.electricity && !room.water) return "MISSING";
  if (room.electricity && room.water) return "COMPLETE";
  return "PARTIAL";
}

function getStatusLabel(status: ReadingStatus) {
  switch (status) {
    case "APPROVED":
      return "Đã duyệt";
    case "REJECTED":
      return "Bị từ chối";
    default:
      return "Chờ duyệt";
  }
}

function getStatusClass(status: ReadingStatus) {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-700";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default function MeterReadingsPage() {
  const [month, setMonth] = useState("4");
  const [year, setYear] = useState("2026");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [keyword, setKeyword] = useState("");

  const summary = useMemo(() => {
    const complete = mockRooms.filter(
      (room) => getRoomStatus(room) === "COMPLETE",
    ).length;
    const partial = mockRooms.filter(
      (room) => getRoomStatus(room) === "PARTIAL",
    ).length;
    const missing = mockRooms.filter(
      (room) => getRoomStatus(room) === "MISSING",
    ).length;

    return { total: mockRooms.length, complete, partial, missing };
  }, []);

  const filteredRooms = mockRooms.filter((room) => {
    const matchesFilter = filter === "ALL" || getRoomStatus(room) === filter;

    const matchesKeyword =
      room.roomNumber.toLowerCase().includes(keyword.toLowerCase()) ||
      room.tenant.toLowerCase().includes(keyword.toLowerCase());

    return matchesFilter && matchesKeyword;
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Quản lý chỉ số điện nước
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi tiến độ gửi chỉ số và kiểm tra báo cáo của người thuê.
        </p>
      </div>

      {/* Chọn kỳ */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
        <ClipboardList className="size-5 text-muted-foreground" />

        <span className="text-sm font-medium">Kỳ báo cáo:</span>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>
              Tháng {i + 1}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
        </select>

        <span className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
          Kỳ {month.padStart(2, "0")}/{year}
        </span>
      </div>

      {/* Thống kê */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Phòng đang thuê"
          value={summary.total}
          description="Tổng phòng cần gửi chỉ số"
          icon={<ClipboardList className="size-5" />}
          color="text-blue-600"
        />
        <SummaryCard
          title="Đã gửi đủ"
          value={summary.complete}
          description="Đã có cả điện và nước"
          icon={<CheckCircle2 className="size-5" />}
          color="text-green-600"
        />
        <SummaryCard
          title="Mới gửi một loại"
          value={summary.partial}
          description="Còn thiếu điện hoặc nước"
          icon={<Clock className="size-5" />}
          color="text-amber-600"
        />
        <SummaryCard
          title="Chưa gửi"
          value={summary.missing}
          description="Chưa có báo cáo nào"
          icon={<AlertCircle className="size-5" />}
          color="text-red-600"
        />
      </div>

      {/* Tìm kiếm và lọc */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo phòng hoặc tên người thuê..."
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="ALL">Tất cả phòng</option>
          <option value="COMPLETE">Đã gửi đủ</option>
          <option value="PARTIAL">Mới gửi một loại</option>
          <option value="MISSING">Chưa gửi</option>
        </select>
      </div>

      {/* Danh sách phòng */}
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b p-4">
          <h2 className="font-semibold">Danh sách phòng</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredRooms.length} phòng trong danh sách
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-4 font-medium">Phòng</th>
                <th className="p-4 font-medium">Người thuê</th>
                <th className="p-4 font-medium">Điện</th>
                <th className="p-4 font-medium">Nước</th>
                <th className="p-4 font-medium">Tiến độ</th>
                <th className="p-4 text-right font-medium">Chi tiết</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredRooms.map((room) => {
                const roomStatus = getRoomStatus(room);

                return (
                  <tr key={room.id} className="hover:bg-muted/30">
                    <td className="p-4 font-semibold">{room.roomNumber}</td>
                    <td className="p-4">{room.tenant}</td>

                    <td className="p-4">
                      {room.electricity ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Zap className="size-4 text-amber-500" />
                            {room.electricity.value.toLocaleString("vi-VN")} kWh
                          </div>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs ${getStatusClass(room.electricity.status)}`}
                          >
                            {getStatusLabel(room.electricity.status)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Chưa gửi</span>
                      )}
                    </td>

                    <td className="p-4">
                      {room.water ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Droplets className="size-4 text-blue-500" />
                            {room.water.value.toLocaleString("vi-VN")} m³
                          </div>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs ${getStatusClass(room.water.status)}`}
                          >
                            {getStatusLabel(room.water.status)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Chưa gửi</span>
                      )}
                    </td>

                    <td className="p-4">
                      {roomStatus === "COMPLETE" ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          Đã gửi đủ
                        </span>
                      ) : roomStatus === "PARTIAL" ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                          Thiếu chỉ số
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                          Chưa gửi
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <Link
                        href={`/landlord/meter_readings/${room.id}?month=${month}&year=${year}`}
                        className="inline-flex items-center gap-2 rounded-md border px-3 py-2 font-medium hover:bg-muted"
                      >
                        <Eye className="size-4" />
                        Xem
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filteredRooms.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-muted-foreground"
                  >
                    Không tìm thấy phòng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  color,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <span className={color}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
