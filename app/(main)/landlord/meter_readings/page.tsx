
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
import { useCallback, useEffect, useMemo, useState } from "react";

// ==================== TYPES ====================

type ReadingStatus = "PENDING" | "APPROVED" | "REJECTED";

type Reading = {
  id: string | number;
  meterType: "ELECTRICITY" | "WATER";
  oldValue: number;
  newValue: number;
  consumption: number;
  readingDate: string;
  status: ReadingStatus;
  imageUrl: string | null;
  submittedBy: string | null;
};

type RoomReading = {
  roomId: string | number;
  roomNumber: string;
  contractId: string | number;
  tenants: {
    profileId: string | number;
    fullName: string;
  }[];
  status: "COMPLETED" | "PARTIAL" | "MISSING";
  readings: {
    electricity: Reading | null;
    water: Reading | null;
  };
};

type MeterReadingsResponse = {
  month: number;
  year: number;
  summary: {
    totalRooms: number;
    completed: number;
    partial: number;
    missing: number;
  };
  items: RoomReading[];
};

type Filter = "ALL" | "COMPLETED" | "PARTIAL" | "MISSING";

// ==================== HELPERS ====================

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

function getRoomStatusLabel(status: RoomReading["status"]) {
  switch (status) {
    case "COMPLETED":
      return "Đã gửi đủ";
    case "PARTIAL":
      return "Thiếu chỉ số";
    default:
      return "Chưa gửi";
  }
}

function getRoomStatusClass(status: RoomReading["status"]) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "PARTIAL":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-red-100 text-red-700";
  }
}

function formatNumber(value: number) {
  return Number(value).toLocaleString("vi-VN");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getTenantNames(room: RoomReading) {
  if (room.tenants.length === 0) {
    return "Chưa có thông tin";
  }

  return room.tenants.map((tenant) => tenant.fullName).join(", ");
}

// ==================== MAIN COMPONENT ====================

export default function MeterReadingsPage() {
  const now = new Date();

  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const [filter, setFilter] = useState<Filter>("ALL");
  const [keyword, setKeyword] = useState("");

  const [items, setItems] = useState<RoomReading[]>([]);

  const [summary, setSummary] = useState({
    totalRooms: 0,
    completed: 0,
    partial: 0,
    missing: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==================== FETCH API ====================

  const fetchReadings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/landlord/meter_readings?month=${month}&year=${year}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể tải dữ liệu chỉ số"
        );
      }

      // Hỗ trợ cả response.data và response.data.data
      const data: MeterReadingsResponse =
        result.data?.data ?? result.data;

      setItems(data.items ?? []);

      setSummary(
        data.summary ?? {
          totalRooms: 0,
          completed: 0,
          partial: 0,
          missing: 0,
        }
      );
    } catch (error) {
      console.error("Fetch meter readings:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi tải dữ liệu"
      );

      setItems([]);
      setSummary({
        totalRooms: 0,
        completed: 0,
        partial: 0,
        missing: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  // ==================== SEARCH & FILTER ====================

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return items.filter((room) => {
      const matchesFilter =
        filter === "ALL" || room.status === filter;

      const tenantNames = getTenantNames(room).toLowerCase();

      const matchesKeyword =
        room.roomNumber.toLowerCase().includes(normalizedKeyword) ||
        tenantNames.includes(normalizedKeyword);

      return matchesFilter && matchesKeyword;
    });
  }, [items, filter, keyword]);

  // ==================== RENDER ====================

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Quản lý chỉ số điện nước
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi tiến độ gửi chỉ số và kiểm tra báo cáo của người thuê.
        </p>
      </div>

      {/* CHỌN KỲ */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
        <ClipboardList className="size-5 text-muted-foreground" />

        <span className="text-sm font-medium">
          Kỳ báo cáo:
        </span>

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
          {Array.from(
            { length: 6 },
            (_, i) => now.getFullYear() - 2 + i
          ).map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>

        <span className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
          Kỳ {month.padStart(2, "0")}/{year}
        </span>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Phòng đang thuê"
          value={summary.totalRooms}
          description="Tổng phòng cần gửi chỉ số"
          icon={<ClipboardList className="size-5" />}
          color="text-blue-600"
        />

        <SummaryCard
          title="Đã gửi đủ"
          value={summary.completed}
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
          description="Chưa có báo cáo hợp lệ"
          icon={<AlertCircle className="size-5" />}
          color="text-red-600"
        />
      </div>

      {/* SEARCH & FILTER */}
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
          <option value="COMPLETED">Đã gửi đủ</option>
          <option value="PARTIAL">Mới gửi một loại</option>
          <option value="MISSING">Chưa gửi</option>
        </select>
      </div>

      {/* ROOM TABLE */}
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b p-4">
          <h2 className="font-semibold">
            Danh sách phòng
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Đang tải dữ liệu..."
              : `${filteredItems.length} phòng trong danh sách`}
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="m-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" />

            <span>{error}</span>

            <button
              onClick={fetchReadings}
              className="ml-auto font-medium underline"
            >
              Thử lại
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-4 font-medium">Phòng</th>
                <th className="p-4 font-medium">Người thuê</th>
                <th className="p-4 font-medium">Điện</th>
                <th className="p-4 font-medium">Nước</th>
                <th className="p-4 font-medium">Tiến độ</th>
                <th className="p-4 text-right font-medium">
                  Chi tiết
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-muted-foreground"
                  >
                    Đang tải dữ liệu chỉ số...
                  </td>
                </tr>
              ) : (
                filteredItems.map((room) => (
                  <tr
                    key={room.contractId}
                    className="hover:bg-muted/30"
                  >
                    <td className="p-4 font-semibold">
                      {room.roomNumber}
                    </td>

                    <td className="max-w-[220px] p-4">
                      <span className="line-clamp-2">
                        {getTenantNames(room)}
                      </span>
                    </td>

                    <td className="p-4">
                      <ReadingCell
                        reading={room.readings.electricity}
                        unit="kWh"
                        icon={
                          <Zap className="size-4 text-amber-500" />
                        }
                      />
                    </td>

                    <td className="p-4">
                      <ReadingCell
                        reading={room.readings.water}
                        unit="m³"
                        icon={
                          <Droplets className="size-4 text-blue-500" />
                        }
                      />
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getRoomStatusClass(room.status)}`}
                      >
                        {getRoomStatusLabel(room.status)}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <Link
                        href={`/landlord/meter_readings/${room.roomId}?month=${month}&year=${year}`}
                        className="inline-flex items-center gap-2 rounded-md border px-3 py-2 font-medium hover:bg-muted"
                      >
                        <Eye className="size-4" />
                        Xem
                      </Link>
                    </td>
                  </tr>
                ))
              )}

              {!loading &&
                filteredItems.length === 0 &&
                !error && (
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

// ==================== READING CELL ====================

function ReadingCell({
  reading,
  unit,
  icon,
}: {
  reading: Reading | null;
  unit: string;
  icon: React.ReactNode;
}) {
  if (!reading) {
    return (
      <span className="text-muted-foreground">
        Chưa gửi
      </span>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        {icon}

        {formatNumber(reading.newValue)} {unit}
      </div>

      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs ${getStatusClass(reading.status)}`}
      >
        {getStatusLabel(reading.status)}
      </span>

      <p className="text-xs text-muted-foreground">
        Tiêu thụ: {formatNumber(reading.consumption)} {unit}
      </p>
    </div>
  );
}

// ==================== SUMMARY CARD ====================

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
        <p className="text-sm text-muted-foreground">
          {title}
        </p>

        <span className={color}>{icon}</span>
      </div>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
