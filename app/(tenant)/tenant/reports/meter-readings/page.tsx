
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Droplets,
  FileImage,
  ImagePlus,
  Loader2,
  RefreshCw,
  Send,
  X,
  Zap,
} from "lucide-react";

import { CldUploadWidget } from "next-cloudinary";

type MeterType = "ELECTRICITY" | "WATER";
type ReadingStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";

interface CurrentReading {
  meterType: MeterType;
  currentValue: number | null;
  readingDate: string | null;
  source: string | null;
  serviceId: string | null;
}

interface MeterService {
  id: string;
  name: string;
  type: string;
  unit: string;
}

interface ReadingHistory {
  id: string;
  meterType: MeterType;
  oldValue: number;
  newValue: number;
  consumption: number;
  readingDate: string;
  status: ReadingStatus;
  imageUrl: string | null;
  note: string | null;
  periodMonth: number | null;
  periodYear: number | null;
  canWithdraw?: boolean;
}

interface PageData {
  room: {
    id: string;
    roomNumber: string;
  };
  currentReadings: CurrentReading[];
  services: MeterService[];
  history: ReadingHistory[];
}

const API_URL = "/api/landlord/meter_readings";
const HISTORY_API_URL = "/api/tenant/meter_readings";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("vi-VN");

const statusConfig = {
  PENDING: {
    label: "Chờ xác nhận",
    color: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  APPROVED: {
    label: "Đã xác nhận",
    color: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Bị từ chối",
    color: "bg-red-100 text-red-700",
    icon: AlertCircle,
  },
  WITHDRAWN: {
    label: "Đã thu hồi",
    color: "bg-gray-100 text-gray-700",
    icon: RefreshCw,
  },
};

export default function TenantMeterReadingsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const [meterType, setMeterType] =
    useState<MeterType>("ELECTRICITY");

  const [newValue, setNewValue] = useState("");

  // Kỳ báo cáo do người thuê lựa chọn
  const currentDate = new Date();
  const [periodMonth, setPeriodMonth] = useState(
    currentDate.getMonth() + 1
  );
  const [periodYear, setPeriodYear] = useState(
    currentDate.getFullYear()
  );

  // URL ảnh sau khi tải lên Cloudinary
  const [imageUrl, setImageUrl] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Kiểm tra thời gian gửi báo cáo
//   const submissionOpen = useMemo(() => {
//     const day = new Date().getDate();
//     return day >= 1 && day <= 3;
    //   }, []);
    const submissionOpen = true;

  // Lấy chỉ số hiện tại theo loại đồng hồ
  const currentReading = useMemo(() => {
    return data?.currentReadings.find(
      (item) => item.meterType === meterType
    );
  }, [data, meterType]);

  // Lấy service tương ứng
    const serviceId = currentReading?.serviceId ?? null;

  const previousValue = currentReading?.currentValue ?? null;

  const consumption = useMemo(() => {
    if (previousValue === null || newValue === "") return null;

    const value = Number(newValue);

    if (!Number.isFinite(value) || value < previousValue) {
      return null;
    }

    return value - previousValue;
  }, [newValue, previousValue]);

  // Load dữ liệu phòng, chỉ số hiện tại và lịch sử
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(HISTORY_API_URL, {
        cache: "no-store",
      });

        const result = await response.json();

        console.log("===== METER READINGS API =====");
        console.log("Status:", response.status);
        console.log("Response:", result);
        console.log("Room:", result.room);
        console.log("Contract:", result.contract);
        console.log("Current readings:", result.currentReadings);
        console.log("History:", result.history);

      if (!response.ok) {
        throw new Error(
          result.message || "Không thể tải dữ liệu chỉ số"
        );
      }

      setData(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải dữ liệu"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // Nhóm lịch sử theo tháng/năm; các bản ghi không có kỳ được xếp riêng.
  const groupedHistory = useMemo(() => {
    const groups = new Map<
      string,
      {
        month: number | null;
        year: number | null;
        readings: ReadingHistory[];
      }
    >();

    for (const reading of data?.history ?? []) {
      const month = reading.periodMonth;
      const year = reading.periodYear;
      const key = month !== null && year !== null
        ? `${year}-${month}`
        : "other";

      if (!groups.has(key)) {
        groups.set(key, { month, year, readings: [] });
      }

      groups.get(key)!.readings.push(reading);
    }

    return Array.from(groups.values()).sort((a, b) => {
      if (a.year === null || a.month === null) return 1;
      if (b.year === null || b.month === null) return -1;
      return b.year - a.year || b.month - a.month;
    });
  }, [data?.history]);
  
    const now = new Date();

    const readingDate = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  // Gửi báo cáo
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!data) return;

    if (!submissionOpen) {
      setError("Chỉ được gửi báo cáo từ ngày 1 đến ngày 3 hàng tháng");
      return;
    }

    if (!serviceId) {
        setError("Không tìm thấy dịch vụ của đồng hồ");
        return;
    }

    if (previousValue === null) {
      setError("Chưa có chỉ số bàn giao ban đầu");
      return;
    }

    const value = Number(newValue);

    if (
      newValue.trim() === "" ||
      !Number.isFinite(value) ||
      value < previousValue
    ) {
      setError("Chỉ số mới không hợp lệ hoặc nhỏ hơn chỉ số cũ");
      return;
    }

    if (!imageUrl) {
      setError("Vui lòng tải ảnh đồng hồ lên Cloudinary");
      return;
    }

    setSubmitting(true);

    try {
      // Tạo báo cáo, ảnh đã được tải lên Cloudinary trước đó
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "MONTHLY_REPORT",
          roomId: data.room.id,
          serviceId: serviceId,
          meterType,
          periodMonth,
          periodYear,
          // Ngày thực tế gửi báo cáo
          readingDate,

          newValue: value,
          imageUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gửi báo cáo thất bại"
        );
      }

      setSuccess(
        "Gửi báo cáo thành công! Vui lòng chờ chủ trọ xác nhận."
      );

      setNewValue("");
      setImageUrl("");

      // 3. Cập nhật lịch sử
      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi gửi báo cáo"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Thu hồi riêng một báo cáo đang chờ xác nhận.
  const handleWithdraw = async (reading: ReadingHistory) => {
    if (reading.status !== "PENDING") return;

    if (reading.canWithdraw !== true) {
      setError("Bạn chỉ có thể thu hồi báo cáo do chính mình gửi.");
      return;
    }

    const meterLabel = reading.meterType === "ELECTRICITY" ? "điện" : "nước";
    const confirmed = window.confirm(
      `Bạn có chắc muốn thu hồi báo cáo ${meterLabel} này không?`
    );

    if (!confirmed) return;

    try {
      setWithdrawingId(reading.id);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/${reading.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WITHDRAWN" }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Thu hồi báo cáo thất bại");
      }

      setSuccess(`Đã thu hồi báo cáo ${meterLabel} thành công.`);
      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể thu hồi báo cáo"
      );
    } finally {
      setWithdrawingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-card p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
          <p className="font-medium">
            Không thể tải thông tin phòng
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>
          <button
            onClick={fetchData}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Báo cáo chỉ số điện nước
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Phòng {data.room.roomNumber} · Theo dõi và gửi chỉ số
            điện nước hàng tháng
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      {/* NOTIFICATION */}
      {!submissionOpen && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <Clock className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              Chưa đến hoặc đã hết thời gian gửi báo cáo
            </p>
            <p className="mt-1 text-sm">
              Bạn chỉ có thể gửi báo cáo từ ngày 1 đến ngày 3
              hàng tháng.
            </p>
          </div>
        </div>
      )}

      {/* CURRENT READINGS */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Chỉ số hiện tại
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              {
                type: "ELECTRICITY",
                label: "Điện",
                icon: Zap,
                unit: "kWh",
                color: "text-amber-500",
                bg: "bg-amber-50",
              },
              {
                type: "WATER",
                label: "Nước",
                icon: Droplets,
                unit: "m³",
                color: "text-blue-500",
                bg: "bg-blue-50",
              },
            ] as const
          ).map((item) => {
            const reading = data.currentReadings.find(
              (r) => r.meterType === item.type
            );

            const Icon = item.icon;

            return (
              <div
                key={item.type}
                className="rounded-xl border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-3 ${item.bg}`}>
                      <Icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    <span className="font-semibold">
                      Đồng hồ {item.label.toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-3xl font-bold tabular-nums">
                    {reading?.currentValue !== null &&
                    reading?.currentValue !== undefined
                      ? formatNumber(reading.currentValue)
                      : "--"}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {item.unit}
                    </span>
                  </p>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {reading?.readingDate
                      ? `Cập nhật: ${formatDate(reading.readingDate)}`
                      : "Chưa có chỉ số được xác nhận"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SUBMISSION FORM */}
      <section className="rounded-xl border bg-card p-5 md:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            Gửi báo cáo chỉ số mới
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhập chỉ số trên đồng hồ và đính kèm ảnh thực tế.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* METER TYPE */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Loại đồng hồ
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMeterType("ELECTRICITY");
                  setNewValue("");
                  setImageUrl("");
                  setError("");
                  setSuccess("");
                }}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition ${
                  meterType === "ELECTRICITY"
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "hover:bg-muted"
                }`}
              >
                <Zap className="h-5 w-5" />
                Điện
              </button>

              <button
                type="button"
                onClick={() => {
                  setMeterType("WATER");
                  setNewValue("");
                  setImageUrl("");
                  setError("");
                  setSuccess("");
                }}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition ${
                  meterType === "WATER"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "hover:bg-muted"
                }`}
              >
                <Droplets className="h-5 w-5" />
                Nước
              </button>
            </div>
          </div>

          {/* OLD VALUE */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Chỉ số cũ
              </label>
              <div className="flex h-10 items-center rounded-lg border bg-muted px-3">
                <span className="font-semibold">
                  {previousValue !== null
                    ? formatNumber(previousValue)
                    : "Chưa có dữ liệu"}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {meterType === "ELECTRICITY" ? "kWh" : "m³"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Chỉ số mới <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={previousValue ?? 0}
                step="0.01"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Nhập chỉ số hiện tại"
                required
                disabled={!submissionOpen || previousValue === null}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>

          {/* CONSUMPTION */}
          {consumption !== null && (
            <div className="rounded-lg bg-primary/5 p-3">
              <p className="text-sm text-muted-foreground">
                Lượng tiêu thụ dự kiến
              </p>
              <p className="mt-1 text-lg font-bold text-primary">
                {formatNumber(consumption)}{" "}
                {meterType === "ELECTRICITY" ? "kWh" : "m³"}
              </p>
            </div>
          )}

          {/* REPORTING PERIOD */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tháng báo cáo <span className="text-red-500">*</span>
              </label>
              <select
                value={periodMonth}
                onChange={(e) => setPeriodMonth(Number(e.target.value))}
                disabled={!submissionOpen}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (month) => (
                    <option key={month} value={month}>
                      Tháng {month}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Năm báo cáo <span className="text-red-500">*</span>
              </label>
              <select
                value={periodYear}
                onChange={(e) => setPeriodYear(Number(e.target.value))}
                disabled={!submissionOpen}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {[currentDate.getFullYear() - 1, currentDate.getFullYear()].map(
                  (year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* IMAGE UPLOAD - CLOUDINARY */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Ảnh đồng hồ <span className="text-red-500">*</span>
            </label>

            {!imageUrl ? (
              <CldUploadWidget
                 config={{
                      cloud: {
                        cloudName: "tpreemmc",
                      },
                    }}
                uploadPreset={
                    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
                  }
                options={{
                  sources: ["local"],
                  multiple: false,
                  maxFiles: 1,
                  resourceType: "image",
                  clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
                  maxFileSize: 5_000_000,
                }}
                onSuccess={(result) => {
                  if (
                    typeof result.info !== "string" &&
                    result.info?.secure_url
                  ) {
                    setImageUrl(result.info.secure_url);
                    setError("");
                  }
                }}
                onError={(error) => {
                  console.error("Cloudinary upload error:", error);
                  setError("Tải ảnh thất bại. Vui lòng thử lại.");
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    disabled={!submissionOpen || submitting}
                    className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition hover:border-primary hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ImagePlus className="mb-3 h-9 w-9 text-muted-foreground" />
                    <p className="text-sm font-medium">Chọn ảnh đồng hồ</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PNG, JPG hoặc WEBP · Tối đa 5MB
                    </p>
                  </button>
                )}
              </CldUploadWidget>
            ) : (
              <div className="relative max-w-sm rounded-xl border p-2">
                <img
                  src={imageUrl}
                  alt="Ảnh đồng hồ đã tải lên"
                  className="mx-auto h-48 w-full rounded-lg object-contain"
                />

                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-green-600">
                    Đã tải ảnh lên Cloudinary
                  </p>
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="flex items-center gap-1 rounded-lg p-2 text-sm text-red-500 hover:bg-red-50"
                    aria-label="Xóa ảnh"
                  >
                    <X className="h-4 w-4" />
                    Xóa ảnh
                  </button>
                </div>

                <CldUploadWidget
                  config={{
                      cloud: {
                        cloudName: "tpreemmc",
                      },
                    }}
                  uploadPreset={
                    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
                  }
                  options={{
                    sources: ["local"],
                    multiple: false,
                    maxFiles: 1,
                    resourceType: "image",
                    clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
                    maxFileSize: 5_000_000,
                    folder: "meter-readings",
                  }}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      disabled={submitting}
                      className="mt-2 block w-full text-center text-sm font-medium text-primary hover:underline disabled:opacity-50"
                    >
                      Chọn ảnh khác
                    </button>
                  )}
                </CldUploadWidget>
              </div>
            )}
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={
              submitting ||
              !submissionOpen ||
              !imageUrl ||
              !serviceId  ||
              previousValue === null
            }
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang gửi báo cáo...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Gửi báo cáo cho chủ trọ
              </>
            )}
          </button>
        </form>
      </section>

      {/* HISTORY */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Lịch sử báo cáo</h2>
            <p className="text-sm text-muted-foreground">
              Theo dõi các báo cáo chỉ số theo từng tháng.
            </p>
          </div>

          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {data.history.length} báo cáo
          </span>
        </div>

        {data.history.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <FileImage className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Chưa có báo cáo nào</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Các báo cáo bạn gửi sẽ được hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedHistory.map((group, index) => (
              <details
                key={group.month !== null && group.year !== null
                  ? `${group.year}-${group.month}`
                  : "other"}
                open={index === 0}
                className="group rounded-xl border bg-card"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">
                      {group.month !== null && group.year !== null
                        ? `Tháng ${group.month}/${group.year}`
                        : "Lịch sử khác"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {group.readings.length} báo cáo
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground transition-transform group-open:rotate-180">
                    ▼
                  </span>
                </summary>

                <div className="space-y-3 border-t p-4">
                  {group.readings.map((reading) => {
                    const config = statusConfig[reading.status];
                    const StatusIcon = config.icon;
                    const isElectricity = reading.meterType === "ELECTRICITY";

                    return (
                      <div
                        key={reading.id}
                        className="rounded-xl border bg-card p-4 md:p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-lg p-2 ${
                                isElectricity
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {isElectricity ? (
                                <Zap className="h-5 w-5" />
                              ) : (
                                <Droplets className="h-5 w-5" />
                              )}
                            </div>

                            <div>
                              <p className="font-semibold">
                                Đồng hồ {isElectricity ? "điện" : "nước"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Ngày ghi nhận: {formatDate(reading.readingDate)}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.color}`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {config.label}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 sm:grid-cols-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Chỉ số cũ</p>
                            <p className="mt-1 font-semibold tabular-nums">
                              {formatNumber(reading.oldValue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Chỉ số mới</p>
                            <p className="mt-1 font-semibold tabular-nums">
                              {formatNumber(reading.newValue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Tiêu thụ</p>
                            <p className="mt-1 font-semibold text-primary tabular-nums">
                              {formatNumber(reading.consumption)} {isElectricity ? "kWh" : "m³"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-muted-foreground">
                            Ngày ghi nhận: {formatDate(reading.readingDate)}
                          </p>

                          {reading.imageUrl && (
                            <a
                              href={reading.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                            >
                              <FileImage className="h-4 w-4" />
                              Xem ảnh đồng hồ
                            </a>
                          )}
                        </div>

                        {reading.note && (
                          <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
                            <p className="text-xs font-medium text-muted-foreground">
                              Ghi chú / Lý do xử lý
                            </p>
                            <p className="mt-1 whitespace-pre-wrap">
                              {reading.note}
                            </p>
                          </div>
                        )}

                        {reading.status === "PENDING" && reading.canWithdraw === true && (
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              disabled={withdrawingId === reading.id}
                              onClick={() => handleWithdraw(reading)}
                              className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {withdrawingId === reading.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                              Thu hồi báo cáo
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
