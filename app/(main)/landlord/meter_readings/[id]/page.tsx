
"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Droplets,
  Image as ImageIcon,
  Loader2,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type ReadingStatus = "PENDING" | "APPROVED" | "REJECTED";

type Reading = {
  id: string;
  meterType: "ELECTRICITY" | "WATER";
  oldValue: number;
  newValue: number;
  consumption: number;
  readingDate: string;
  status: ReadingStatus;
  imageUrl: string | null;
  note: string | null;
};

type RoomDetail = {
  roomId: string;
  roomNumber: string;
  contractId: string;
  tenants: {
    profileId: string;
    fullName: string;
  }[];
  status: "COMPLETED" | "PARTIAL" | "MISSING";
  readings: {
    electricity: Reading | null;
    water: Reading | null;
  };
};

function statusLabel(status: ReadingStatus) {
  if (status === "APPROVED") return "Đã duyệt";
  if (status === "REJECTED") return "Bị từ chối";
  return "Chờ duyệt";
}

function statusClass(status: ReadingStatus) {
  if (status === "APPROVED") return "bg-green-100 text-green-700";
  if (status === "REJECTED") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

export default function MeterReadingDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const roomId = params.id;
  const month = searchParams.get("month") ?? String(new Date().getMonth() + 1);
  const year = searchParams.get("year") ?? String(new Date().getFullYear());

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const fetchRoomDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/landlord/meter_readings?month=${month}&year=${year}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải báo cáo chỉ số");
      }

      const data = result.data?.data ?? result.data;

      const foundRoom = (data.items ?? []).find(
        (item: RoomDetail) => String(item.roomId) === String(roomId)
      );

      if (!foundRoom) {
        setRoom(null);
        return;
      }

      setRoom(foundRoom);
    } catch (error) {
      console.error("Fetch meter reading detail:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi tải dữ liệu"
      );
    } finally {
      setLoading(false);
    }
  }, [roomId, month, year]);

  useEffect(() => {
    fetchRoomDetail();
  }, [fetchRoomDetail]);

  const updateStatus = async (
    reading: Reading,
    status: "APPROVED" | "REJECTED",
    note?: string
  ) => {
    try {
      setProcessingId(reading.id);
      setMessage("");

      const response = await fetch(
        `/api/landlord/meter_readings/${reading.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            ...(status === "REJECTED" ? { note } : {}),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể cập nhật trạng thái");
      }

      setMessage(
        status === "APPROVED"
          ? "Đã chấp nhận báo cáo thành công."
          : "Đã từ chối báo cáo thành công."
      );

      setRejectingId(null);
      setRejectionReason("");

      await fetchRoomDetail();
    } catch (error) {
      console.error("Update meter reading status:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi cập nhật trạng thái"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (reading: Reading) => {
    if (!rejectionReason.trim()) {
      setMessage("Vui lòng nhập lý do từ chối.");
      return;
    }

    updateStatus(reading, "REJECTED", rejectionReason.trim());
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2">
        <Loader2 className="size-5 animate-spin" />
        <span>Đang tải chi tiết báo cáo...</span>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="space-y-4 p-6">
        <p className="font-semibold">
          {error || "Không tìm thấy dữ liệu phòng trong kỳ này."}
        </p>

        <Link
          href={`/landlord/meter_readings?month=${month}&year=${year}`}
          className="inline-flex items-center gap-2 text-sm text-blue-600"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách
        </Link>

        {error && (
          <button
            onClick={fetchRoomDetail}
            className="ml-3 text-sm font-medium underline"
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  const readings = [
    room.readings.electricity,
    room.readings.water,
  ].filter((reading): reading is Reading => reading !== null);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <Link
        href={`/landlord/meter_readings?month=${month}&year=${year}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Quay lại quản lý chỉ số
      </Link>

      <div>
        <p className="text-sm text-muted-foreground">
          Kỳ {month.padStart(2, "0")}/{year}
        </p>

        <h1 className="mt-1 text-2xl font-bold">
          Chi tiết chỉ số phòng {room.roomNumber}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Người thuê:{" "}
          {room.tenants.map((tenant) => tenant.fullName).join(", ") ||
            "Chưa có thông tin"}
        </p>
      </div>

      {message && (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          {message}
        </div>
      )}

      {readings.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <AlertTriangle className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Phòng chưa gửi chỉ số</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Chưa có báo cáo điện hoặc nước trong kỳ này.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {readings.map((reading) => {
            const isElectricity = reading.meterType === "ELECTRICITY";
            const Icon = isElectricity ? Zap : Droplets;
            const unit = isElectricity ? "kWh" : "m³";
            const isProcessing = processingId === reading.id;
            const isRejecting = rejectingId === reading.id;

            return (
              <section
                key={reading.id}
                className="overflow-hidden rounded-xl border bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Icon
                        className={`size-5 ${
                          isElectricity ? "text-amber-500" : "text-blue-500"
                        }`}
                      />
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        Chỉ số {isElectricity ? "điện" : "nước"}
                      </h2>

                      <p className="text-xs text-muted-foreground">
                        Gửi lúc {formatDate(reading.readingDate)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                      reading.status
                    )}`}
                  >
                    {statusLabel(reading.status)}
                  </span>
                </div>

                <div className="grid gap-5 p-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Ảnh đồng hồ người thuê gửi
                    </p>

                    {reading.imageUrl ? (
                      <a
                        href={reading.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={reading.imageUrl}
                          alt={`Ảnh đồng hồ ${isElectricity ? "điện" : "nước"}`}
                          className="max-h-72 w-full rounded-lg border object-contain"
                        />
                      </a>
                    ) : (
                      <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-6 text-center">
                        <ImageIcon className="size-10 text-muted-foreground" />
                        <p className="mt-3 text-sm font-medium">
                          Không có ảnh đồng hồ
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">
                          Chỉ số cũ
                        </p>
                        <p className="mt-2 text-2xl font-bold">
                          {reading.oldValue.toLocaleString("vi-VN")}
                        </p>
                        <p className="text-xs text-muted-foreground">{unit}</p>
                      </div>

                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">
                          Chỉ số mới
                        </p>
                        <p className="mt-2 text-2xl font-bold">
                          {reading.newValue.toLocaleString("vi-VN")}
                        </p>
                        <p className="text-xs text-muted-foreground">{unit}</p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-blue-50 p-4">
                      <p className="text-sm text-blue-700">
                        Lượng tiêu thụ trong kỳ
                      </p>
                      <p className="mt-1 text-2xl font-bold text-blue-800">
                        {reading.consumption.toLocaleString("vi-VN")} {unit}
                      </p>
                      <p className="mt-1 text-xs text-blue-700">
                        {reading.newValue} − {reading.oldValue}
                      </p>
                    </div>

                    {reading.note && (
                      <div className="rounded-lg border p-3">
                        <p className="text-sm font-medium">Ghi chú</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {reading.note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t bg-muted/20 p-4">
                  {reading.status === "PENDING" ? (
                    isRejecting ? (
                      <div className="space-y-3">
                        <label
                          htmlFor={`reason-${reading.id}`}
                          className="text-sm font-medium"
                        >
                          Lý do từ chối
                        </label>

                        <textarea
                          id={`reason-${reading.id}`}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Ví dụ: Ảnh mờ, không đọc được chỉ số..."
                          className="min-h-24 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />

                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => {
                              setRejectingId(null);
                              setRejectionReason("");
                              setMessage("");
                            }}
                            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                          >
                            Hủy
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleReject(reading)}
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {isProcessing ? "Đang xử lý..." : "Xác nhận từ chối"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => {
                            setRejectingId(reading.id);
                            setRejectionReason("");
                            setMessage("");
                          }}
                          className="inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircle className="size-4" />
                          Từ chối
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => updateStatus(reading, "APPROVED")}
                          className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          Chấp nhận
                        </button>
                      </div>
                    )
                  ) : (
                    <p className="text-right text-sm text-muted-foreground">
                      Báo cáo này đã được xử lý.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
