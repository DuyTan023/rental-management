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

type InvoiceGenerationResult = {
  total: number;
  success_count: number;
  failed_count: number;
  results: {
    contract_id: string;
    status: "SUCCESS" | "FAILED";
    invoice_id?: string;
    message?: string;
  }[];
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
  // Danh sách hợp đồng được chọn
  const [selectedContractIds, setSelectedContractIds] = useState<Set<string>>(
    new Set(),
  );

  // Dialog xác nhận
  const [openConfirm, setOpenConfirm] = useState(false);

  // Hạn thanh toán
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  });

  // Trạng thái lập hóa đơn
  const [generating, setGenerating] = useState(false);

  // Kết quả lập hóa đơn
  const [generationResult, setGenerationResult] =
    useState<InvoiceGenerationResult | null>(null);

  // ==================== FETCH API ====================

  const fetchReadings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/landlord/meter_readings?month=${month}&year=${year}`,
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải dữ liệu chỉ số");
      }

      // Hỗ trợ cả response.data và response.data.data
      const data: MeterReadingsResponse = result.data?.data ?? result.data;

      setItems(data.items ?? []);

      setSummary(
        data.summary ?? {
          totalRooms: 0,
          completed: 0,
          partial: 0,
          missing: 0,
        },
      );
    } catch (error) {
      console.error("Fetch meter readings:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi tải dữ liệu",
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReadings();
  }, [fetchReadings]);

  // ==================== SEARCH & FILTER ====================

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return items.filter((room) => {
      const matchesFilter = filter === "ALL" || room.status === filter;

      const tenantNames = getTenantNames(room).toLowerCase();

      const matchesKeyword =
        room.roomNumber.toLowerCase().includes(normalizedKeyword) ||
        tenantNames.includes(normalizedKeyword);

      return matchesFilter && matchesKeyword;
    });
  }, [items, filter, keyword]);

  // Các phòng có đủ chỉ số điện nước đã được duyệt
  const eligibleItems = useMemo(() => {
    return items.filter(
      (room) =>
        room.readings.electricity?.status === "APPROVED" &&
        room.readings.water?.status === "APPROVED",
    );
  }, [items]);

  // Danh sách phòng được chọn
  const selectedItems = useMemo(() => {
    return eligibleItems.filter((room) =>
      selectedContractIds.has(String(room.contractId)),
    );
  }, [eligibleItems, selectedContractIds]);

  // Kiểm tra đã chọn tất cả phòng đủ điều kiện chưa
  const isAllSelected =
    eligibleItems.length > 0 &&
    eligibleItems.every((room) =>
      selectedContractIds.has(String(room.contractId)),
    );

  // Chọn hoặc bỏ chọn một phòng
  const handleSelectRoom = (contractId: string | number) => {
    const id = String(contractId);

    setSelectedContractIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  // Chọn hoặc bỏ chọn tất cả phòng đủ điều kiện
  const handleSelectAll = (checked: boolean) => {
    setSelectedContractIds((prev) => {
      const next = new Set(prev);

      eligibleItems.forEach((room) => {
        const id = String(room.contractId);

        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });

      return next;
    });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedContractIds(new Set());
    setGenerationResult(null);
  }, [month, year]);

  const handleGenerateInvoices = async () => {
    if (selectedItems.length === 0) {
      return;
    }

    try {
      setGenerating(true);

      const response = await fetch("/api/landlord/invoices/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_ids: selectedItems.map((room) => String(room.contractId)),
          billing_month: Number(month),
          billing_year: Number(year),
          due_date: dueDate,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể lập hóa đơn");
      }

      // Hỗ trợ cả response.data và response.data.data
      const data: InvoiceGenerationResult = result.data?.data ?? result.data;

      setGenerationResult(data);

      // Bỏ chọn các phòng sau khi lập hóa đơn
      setSelectedContractIds(new Set());
    } catch (error) {
      console.error("Generate invoices:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi lập hóa đơn",
      );
    } finally {
      setGenerating(false);
    }
  };

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
          {Array.from({ length: 6 }, (_, i) => now.getFullYear() - 2 + i).map(
            (y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ),
          )}
        </select>

        <span className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
          Kỳ {month.padStart(2, "0")}/{year}
        </span>
      </div>
      {/* GENERATE INVOICES */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
        <div>
          <p className="font-semibold">Lập hóa đơn theo kỳ</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Đã chọn {selectedContractIds.size} / {eligibleItems.length} phòng đủ
            điều kiện
          </p>
        </div>

        <button
          type="button"
          disabled={selectedItems.length === 0 || loading || generating}
          onClick={() => {
            setGenerationResult(null);
            setOpenConfirm(true);
          }}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ClipboardList className="size-4" />
          Tạo hóa đơn cho kỳ này ({selectedItems.length})
        </button>
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
          <h2 className="font-semibold">Danh sách phòng</h2>

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
                <th className="w-12 p-4">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    disabled={eligibleItems.length === 0 || loading}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="size-4 cursor-pointer accent-blue-600"
                    title="Chọn tất cả phòng đủ điều kiện"
                  />
                </th>

                <th className="p-4 font-medium">Phòng</th>
                <th className="p-4 font-medium">Người thuê</th>
                <th className="p-4 font-medium">Điện</th>
                <th className="p-4 font-medium">Nước</th>
                <th className="p-4 font-medium">Tiến độ</th>
                <th className="p-4 text-right font-medium">Chi tiết</th>
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
                filteredItems.map((room) => {
                  const isEligible =
                    room.readings.electricity?.status === "APPROVED" &&
                    room.readings.water?.status === "APPROVED";

                  const isSelected = selectedContractIds.has(
                    String(room.contractId),
                  );

                  return (
                    <tr
                      key={room.contractId}
                      className={`hover:bg-muted/30 ${
                        isSelected ? "bg-blue-50/50" : ""
                      }`}
                    >
                      {/* CHECKBOX */}
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isEligible}
                          onChange={() => handleSelectRoom(room.contractId)}
                          className="size-4 cursor-pointer accent-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                          title={
                            isEligible
                              ? "Chọn phòng này"
                              : "Phòng chưa đủ chỉ số APPROVED"
                          }
                        />
                      </td>

                      {/* Các cột còn lại giữ nguyên code cũ */}
                      <td className="p-4 font-semibold">{room.roomNumber}</td>

                      <td className="max-w-[220px] p-4">
                        <span className="line-clamp-2">
                          {getTenantNames(room)}
                        </span>
                      </td>

                      <td className="p-4">
                        <ReadingCell
                          reading={room.readings.electricity}
                          unit="kWh"
                          icon={<Zap className="size-4 text-amber-500" />}
                        />
                      </td>

                      <td className="p-4">
                        <ReadingCell
                          reading={room.readings.water}
                          unit="m³"
                          icon={<Droplets className="size-4 text-blue-500" />}
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
                  );
                })
              )}

              {!loading && filteredItems.length === 0 && !error && (
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

      {/* DIALOG LẬP HÓA ĐƠN */}
      {openConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-dialog-title"
            className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 id="invoice-dialog-title" className="text-lg font-semibold">
                  {generationResult
                    ? "Kết quả lập hóa đơn"
                    : "Xác nhận lập hóa đơn"}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Kỳ {month.padStart(2, "0")}/{year}
                </p>
              </div>

              {!generating && (
                <button
                  type="button"
                  onClick={() => {
                    setOpenConfirm(false);
                    setGenerationResult(null);
                  }}
                  className="rounded-md p-2 hover:bg-muted"
                >
                  ✕
                </button>
              )}
            </div>

            {/* CONTENT */}
            <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
              {!generationResult ? (
                <>
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-blue-700">
                      Bạn đang chuẩn bị lập hóa đơn cho:
                    </p>

                    <p className="mt-1 text-2xl font-bold text-blue-700">
                      {selectedItems.length} phòng
                    </p>

                    <p className="mt-1 text-sm text-blue-700">
                      Kỳ hóa đơn: Tháng {month}/{year}
                    </p>
                  </div>

                  {/* HẠN THANH TOÁN */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Hạn thanh toán
                    </label>

                    <input
                      type="date"
                      value={dueDate}
                      min={`${year}-${month.padStart(2, "0")}-01`}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={generating}
                      className="h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* DANH SÁCH PHÒNG */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Danh sách phòng được lập hóa đơn
                    </p>

                    <div className="divide-y rounded-lg border">
                      {selectedItems.map((room) => (
                        <div
                          key={room.contractId}
                          className="flex items-center justify-between gap-3 p-3"
                        >
                          <div>
                            <p className="font-medium">
                              Phòng {room.roomNumber}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {getTenantNames(room)}
                            </p>
                          </div>

                          <CheckCircle2 className="size-5 shrink-0 text-green-600" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Hệ thống sẽ tự động tính tiền phòng, dịch vụ và điện nước
                    theo quy tắc nghiệp vụ. Các hóa đơn được tạo độc lập.
                  </p>
                </>
              ) : (
                <>
                  {/* TỔNG KẾT */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Tổng</p>
                      <p className="mt-1 text-xl font-bold">
                        {generationResult.total}
                      </p>
                    </div>

                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-xs text-green-600">Thành công</p>
                      <p className="mt-1 text-xl font-bold text-green-600">
                        {generationResult.success_count}
                      </p>
                    </div>

                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-xs text-red-600">Thất bại</p>
                      <p className="mt-1 text-xl font-bold text-red-600">
                        {generationResult.failed_count}
                      </p>
                    </div>
                  </div>

                  {/* KẾT QUẢ TỪNG PHÒNG */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Chi tiết kết quả</p>

                    <div className="divide-y rounded-lg border">
                      {generationResult.results.map((item) => {
                        const room = items.find(
                          (r) => String(r.contractId) === item.contract_id,
                        );

                        return (
                          <div
                            key={item.contract_id}
                            className="flex items-start justify-between gap-3 p-3"
                          >
                            <div className="min-w-0">
                              <p className="font-medium">
                                Phòng {room?.roomNumber ?? item.contract_id}
                              </p>

                              {item.status === "SUCCESS" ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Mã hóa đơn: {item.invoice_id}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-red-600">
                                  {item.message}
                                </p>
                              )}
                            </div>

                            {item.status === "SUCCESS" ? (
                              <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                Thành công
                              </span>
                            ) : (
                              <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                                Thất bại
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-2 border-t p-4">
              {!generationResult ? (
                <>
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => setOpenConfirm(false)}
                    className="h-10 rounded-md border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    Hủy
                  </button>

                  <button
                    type="button"
                    disabled={
                      generating || selectedItems.length === 0 || !dueDate
                    }
                    onClick={handleGenerateInvoices}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Đang lập hóa đơn...
                      </>
                    ) : (
                      "Xác nhận tạo hóa đơn"
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setOpenConfirm(false);
                    setGenerationResult(null);
                    fetchReadings();
                  }}
                  className="h-10 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}
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
    return <span className="text-muted-foreground">Chưa gửi</span>;
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
        <p className="text-sm text-muted-foreground">{title}</p>

        <span className={color}>{icon}</span>
      </div>

      <p className="mt-3 text-3xl font-bold">{value}</p>

      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
