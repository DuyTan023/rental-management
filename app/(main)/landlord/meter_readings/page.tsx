
"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Droplets,
  FileText,
  Search,
  Send,
  Zap,
} from "lucide-react";

type ReadingStatus = "SUBMITTED" | "PARTIAL" | "NOT_SUBMITTED";

type MeterValue = {
  oldValue: number | null;
  newValue: number | null;
};

type RoomReading = {
  roomId: string;
  roomNumber: string;
  tenantName: string;
  phone: string;
  electricity: MeterValue;
  water: MeterValue;
  submittedAt: string | null;
  electricityStatus: ReadingStatus;
  waterStatus: ReadingStatus;
};

const months = ["02/2026", "01/2026", "12/2025"];

const mockReadings: RoomReading[] = [
  {
    roomId: "1",
    roomNumber: "P101",
    tenantName: "Nguyễn Văn An",
    phone: "0987 654 321",
    electricity: { oldValue: 1200, newValue: 1350 },
    water: { oldValue: 45, newValue: 51 },
    submittedAt: "03/02/2026",
    electricityStatus: "SUBMITTED",
    waterStatus: "SUBMITTED",
  },
  {
    roomId: "2",
    roomNumber: "P102",
    tenantName: "Trần Thị Bình",
    phone: "0901 234 567",
    electricity: { oldValue: 850, newValue: 970 },
    water: { oldValue: 32, newValue: null },
    submittedAt: "04/02/2026",
    electricityStatus: "SUBMITTED",
    waterStatus: "NOT_SUBMITTED",
  },
  {
    roomId: "3",
    roomNumber: "P103",
    tenantName: "Lê Văn Cường",
    phone: "0912 345 678",
    electricity: { oldValue: 640, newValue: null },
    water: { oldValue: 28, newValue: null },
    submittedAt: null,
    electricityStatus: "NOT_SUBMITTED",
    waterStatus: "NOT_SUBMITTED",
  },
  {
    roomId: "4",
    roomNumber: "P104",
    tenantName: "Phạm Thị Dung",
    phone: "0933 456 789",
    electricity: { oldValue: 2100, newValue: 2225 },
    water: { oldValue: 76, newValue: 82 },
    submittedAt: "02/02/2026",
    electricityStatus: "SUBMITTED",
    waterStatus: "SUBMITTED",
  },
];

function getConsumption(meter: MeterValue) {
  if (meter.oldValue === null || meter.newValue === null) return null;
  return meter.newValue - meter.oldValue;
}

function StatusBadge({ status }: { status: ReadingStatus }) {
  const config = {
    SUBMITTED: {
      label: "Đã gửi",
      className: "bg-green-50 text-green-700 ring-green-200",
      icon: CheckCircle2,
    },
    PARTIAL: {
      label: "Gửi thiếu",
      className: "bg-amber-50 text-amber-700 ring-amber-200",
      icon: Clock3,
    },
    NOT_SUBMITTED: {
      label: "Chưa gửi",
      className: "bg-orange-50 text-orange-700 ring-orange-200",
      icon: Clock3,
    },
  }[status];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${config.className}`}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
}

export default function MeterReadingsPage() {
  const [selectedMonth, setSelectedMonth] = useState("02/2026");
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("ALL");

  // Dữ liệu tĩnh để thử giao diện, chưa gọi API.
  // Khi tích hợp backend, thay nguồn dữ liệu tại đây.
  const readings = useMemo(() => {
    if (selectedMonth === "02/2026") return mockReadings;

    // Tạo dữ liệu minh họa cho những chu kỳ còn lại.
    // Không phải số liệu thực tế từ database.
    return mockReadings.map((room, index) => {
      if (selectedMonth === "01/2026") {
        const previous = [room.electricity, room.water];

        return {
          ...room,
          electricity: {
            oldValue: previous[0].oldValue,
            newValue:
              previous[0].newValue === null
                ? null
                : previous[0].newValue - [150, 120, 90, 125][index],
          },
          water: {
            oldValue: previous[1].oldValue,
            newValue:
              previous[1].newValue === null
                ? null
                : previous[1].newValue - [6, 5, 4, 6][index],
          },
          submittedAt: index === 2 ? null : `0${index + 1}/01/2026`,
        };
      }

      return {
        ...room,
        electricity: {
          oldValue: room.electricity.oldValue,
          newValue: room.electricity.newValue,
        },
        water: {
          oldValue: room.water.oldValue,
          newValue: room.water.newValue,
        },
        submittedAt: index === 1 || index === 2
          ? null
          : `${index + 1 < 10 ? "0" : ""}${index + 1}/12/2025`,
      };
    });
  }, [selectedMonth]);

  const filteredReadings = readings.filter((room) => {
    const matchesKeyword =
      room.roomNumber.toLowerCase().includes(keyword.toLowerCase()) ||
      room.tenantName.toLowerCase().includes(keyword.toLowerCase());

    const isComplete =
      room.electricity.newValue !== null &&
      room.water.newValue !== null;

    const matchesFilter =
      filter === "ALL" ||
      (filter === "SUBMITTED" && isComplete) ||
      (filter === "PARTIAL" &&
        !isComplete &&
        (room.electricity.newValue !== null ||
          room.water.newValue !== null)) ||
      (filter === "NOT_SUBMITTED" &&
        room.electricity.newValue === null &&
        room.water.newValue === null);

    return matchesKeyword && matchesFilter;
  });

  const submittedCount = readings.filter(
    (r) => r.electricity.newValue !== null && r.water.newValue !== null,
  ).length;

  const partialCount = readings.filter(
    (r) =>
      (r.electricity.newValue !== null || r.water.newValue !== null) &&
      !(r.electricity.newValue !== null && r.water.newValue !== null),
  ).length;

  const notSubmittedCount = readings.length - submittedCount - partialCount;

  const totalElectricity = readings.reduce(
    (sum, room) => sum + (getConsumption(room.electricity) ?? 0),
    0,
  );

  const totalWater = readings.reduce(
    (sum, room) => sum + (getConsumption(room.water) ?? 0),
    0,
  );

  const deadline = `05/${selectedMonth}`;

  function getRoomStatus(room: RoomReading): ReadingStatus {
    const electricitySent = room.electricity.newValue !== null;
    const waterSent = room.water.newValue !== null;

    if (electricitySent && waterSent) return "SUBMITTED";
    if (electricitySent || waterSent) return "PARTIAL";
    return "NOT_SUBMITTED";
  }

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 md:p-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <Droplets size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Quản lý chỉ số điện nước
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Theo dõi chỉ số phòng trọ theo từng chu kỳ hàng tháng
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <CalendarDays size={18} className="text-blue-600" />
            <label htmlFor="month" className="text-sm text-slate-600">
              Chu kỳ:
            </label>
            <select
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 outline-none"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Đã gửi đủ điện nước"
            value={`${submittedCount}/${readings.length}`}
            description="Phòng đã hoàn thành"
            icon={<CheckCircle2 size={22} />}
            color="green"
          />
          <SummaryCard
            title="Gửi chưa đầy đủ"
            value={String(partialCount)}
            description="Còn thiếu ít nhất một chỉ số"
            icon={<Clock3 size={22} />}
            color="amber"
          />
          <SummaryCard
            title="Chưa gửi chỉ số"
            value={String(notSubmittedCount)}
            description="Chưa có chỉ số điện và nước"
            icon={<Send size={22} />}
            color="orange"
          />
          <SummaryCard
            title="Hạn chốt chỉ số"
            value={deadline}
            description="Ngày 5: tiến hành lập hóa đơn"
            icon={<CalendarDays size={22} />}
            color="blue"
          />
        </div>

        {/* Workflow notice */}
        <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-blue-950">
              Quy trình chu kỳ {selectedMonth}
            </p>
            <p className="mt-1 text-sm text-blue-800">
              Ngày 1–4: người thuê gửi chỉ số. Ngày 5: chốt số liệu và lập hóa đơn.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-white px-3 py-1.5 text-blue-700 ring-1 ring-blue-200">
              <span className="mr-1.5">●</span> Đã gửi đủ
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-amber-700 ring-1 ring-amber-200">
              <span className="mr-1.5">●</span> Gửi thiếu
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-orange-700 ring-1 ring-orange-200">
              <span className="mr-1.5">●</span> Chưa gửi
            </span>
          </div>
        </div>

        {/* Readings table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Danh sách chỉ số theo phòng
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Chỉ số mới trừ chỉ số cũ bằng lượng tiêu thụ trong kỳ
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm phòng, người thuê..."
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-60"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                aria-label="Lọc trạng thái gửi chỉ số"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="SUBMITTED">Đã gửi đủ</option>
                <option value="PARTIAL">Gửi thiếu</option>
                <option value="NOT_SUBMITTED">Chưa gửi</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Phòng</th>
                  <th className="px-5 py-4 font-semibold">Người thuê</th>
                  <th className="px-5 py-4 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Zap size={15} className="text-amber-500" />
                      Điện (kWh)
                    </span>
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Droplets size={15} className="text-blue-500" />
                      Nước (m³)
                    </span>
                  </th>
                  <th className="px-5 py-4 font-semibold">Ngày gửi</th>
                  <th className="px-5 py-4 font-semibold">Trạng thái</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredReadings.map((room) => {
                  const status = getRoomStatus(room);

                  return (
                    <tr key={room.roomId} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg bg-blue-50 px-3 py-2 font-bold text-blue-700">
                          {room.roomNumber}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {room.tenantName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {room.phone}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <MeterCell
                          meter={room.electricity}
                          unit="kWh"
                          icon={<Zap size={15} />}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <MeterCell
                          meter={room.water}
                          unit="m³"
                          icon={<Droplets size={15} />}
                        />
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {room.submittedAt ?? "—"}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={status} />
                        {status !== "SUBMITTED" && (
                          <p className="mt-1.5 text-xs text-slate-400">
                            {status === "PARTIAL"
                              ? "Cần bổ sung chỉ số"
                              : "Chờ người thuê gửi"}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredReadings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <Search
                        size={28}
                        className="mx-auto mb-2 text-slate-300"
                      />
                      <p className="font-medium text-slate-600">
                        Không tìm thấy phòng phù hợp
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Thử đổi từ khóa hoặc trạng thái lọc.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Hiển thị {filteredReadings.length} / {readings.length} phòng
            </span>
            <span>
              Tổng tiêu thụ đã ghi nhận:{" "}
              <strong className="text-amber-600">
                {totalElectricity.toLocaleString("vi-VN")} kWh
              </strong>
              {" · "}
              <strong className="text-blue-600">
                {totalWater.toLocaleString("vi-VN")} m³
              </strong>
            </span>
          </div>
        </div>

        {/* Invoice preparation */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                Chuẩn bị lập hóa đơn tháng {selectedMonth}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Đã có đủ chỉ số điện nước: {submittedCount}/{readings.length} phòng.
                Cần xử lý các phòng còn thiếu trước khi chốt.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={submittedCount !== readings.length}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            title={
              submittedCount !== readings.length
                ? "Cần đủ chỉ số điện nước của tất cả phòng trước khi chốt"
                : "Dữ liệu demo: nút chưa kết nối lập hóa đơn"
            }
            onClick={() => {
              alert("Đây là giao diện demo, chưa kết nối chức năng lập hóa đơn.");
            }}
          >
            <FileText size={17} />
            Chốt chỉ số & lập hóa đơn
          </button>
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
  value: string;
  description: string;
  icon: React.ReactNode;
  color: "green" | "amber" | "orange" | "blue";
}) {
  const colors = {
    green: "bg-green-50 text-green-700 border-green-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className={`rounded-xl border p-3 ${colors[color]}`}>{icon}</div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function MeterCell({
  meter,
  unit,
  icon,
}: {
  meter: MeterValue;
  unit: string;
  icon: React.ReactNode;
}) {
  const consumption = getConsumption(meter);

  return (
    <div className="min-w-[130px]">
      {meter.newValue === null ? (
        <span className="text-sm text-slate-400">Chưa gửi</span>
      ) : (
        <>
          <p className="font-semibold tabular-nums text-slate-800">
            {meter.newValue.toLocaleString("vi-VN")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Cũ: {meter.oldValue?.toLocaleString("vi-VN") ?? "—"}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-600">
            {icon}
            Tiêu thụ: {consumption?.toLocaleString("vi-VN")} {unit}
          </p>
        </>
      )}
    </div>
  );
}
