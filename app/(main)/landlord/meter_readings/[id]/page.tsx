"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Droplets,
  Image as ImageIcon,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";

type ReadingStatus = "PENDING" | "APPROVED" | "REJECTED";

type Reading = {
  type: "ELECTRICITY" | "WATER";
  oldValue: number;
  newValue: number;
  status: ReadingStatus;
  submittedAt: string;
  note: string;
  imageUrl?: string;
};

const mockRoomDetails: Record<
  string,
  { roomNumber: string; tenant: string; readings: Reading[] }
> = {
  "1": {
    roomNumber: "P101",
    tenant: "Nguyễn Văn An",
    readings: [
      {
        type: "ELECTRICITY",
        oldValue: 1200,
        newValue: 1250,
        status: "PENDING",
        submittedAt: "03/04/2026 09:15",
        note: "Chỉ số điện tháng này.",
      },
      {
        type: "WATER",
        oldValue: 300,
        newValue: 320,
        status: "PENDING",
        submittedAt: "03/04/2026 09:16",
        note: "Chỉ số nước tháng này.",
      },
    ],
  },
  "2": {
    roomNumber: "P102",
    tenant: "Trần Thị Bình",
    readings: [
      {
        type: "ELECTRICITY",
        oldValue: 940,
        newValue: 980,
        status: "APPROVED",
        submittedAt: "02/04/2026 10:00",
        note: "Đã kiểm tra.",
      },
      {
        type: "WATER",
        oldValue: 200,
        newValue: 215,
        status: "PENDING",
        submittedAt: "03/04/2026 08:30",
        note: "",
      },
    ],
  },
  "3": {
    roomNumber: "P103",
    tenant: "Lê Văn Cường",
    readings: [
      {
        type: "ELECTRICITY",
        oldValue: 1500,
        newValue: 1560,
        status: "PENDING",
        submittedAt: "03/04/2026 11:00",
        note: "",
      },
    ],
  },
  "4": {
    roomNumber: "P104",
    tenant: "Phạm Thị Dung",
    readings: [],
  },
  "5": {
    roomNumber: "P105",
    tenant: "Hoàng Văn Minh",
    readings: [
      {
        type: "ELECTRICITY",
        oldValue: 850,
        newValue: 870,
        status: "REJECTED",
        submittedAt: "03/04/2026 14:00",
        note: "Ảnh chưa rõ số trên đồng hồ.",
      },
      {
        type: "WATER",
        oldValue: 180,
        newValue: 190,
        status: "APPROVED",
        submittedAt: "03/04/2026 14:05",
        note: "",
      },
    ],
  },
  "6": {
    roomNumber: "P106",
    tenant: "Đỗ Thị Hoa",
    readings: [
      {
        type: "ELECTRICITY",
        oldValue: 1050,
        newValue: 1100,
        status: "APPROVED",
        submittedAt: "02/04/2026 09:00",
        note: "",
      },
      {
        type: "WATER",
        oldValue: 240,
        newValue: 260,
        status: "APPROVED",
        submittedAt: "02/04/2026 09:05",
        note: "",
      },
    ],
  },
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

export default function MeterReadingDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const roomId = params.id;
  const month = searchParams.get("month") ?? "4";
  const year = searchParams.get("year") ?? "2026";

  const room = mockRoomDetails[roomId];

  const [readings, setReadings] = useState<Reading[]>(room?.readings ?? []);
  const [rejectingIndex, setRejectingIndex] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [message, setMessage] = useState("");

  function approveReading(index: number) {
    setReadings((current) =>
      current.map((reading, i) =>
        i === index ? { ...reading, status: "APPROVED" } : reading,
      ),
    );
    setMessage("Đã chấp nhận báo cáo (dữ liệu minh họa).");
  }

  function rejectReading(index: number) {
    if (!rejectionReason.trim()) {
      setMessage("Vui lòng nhập lý do từ chối.");
      return;
    }

    setReadings((current) =>
      current.map((reading, i) =>
        i === index
          ? {
              ...reading,
              status: "REJECTED",
              note: rejectionReason.trim(),
            }
          : reading,
      ),
    );

    setRejectingIndex(null);
    setRejectionReason("");
    setMessage("Đã từ chối báo cáo (dữ liệu minh họa).");
  }

  if (!room) {
    return (
      <div className="space-y-4 p-6">
        <p className="font-semibold">Không tìm thấy phòng.</p>
        <Link
          href="/landlord/meter_readings"
          className="inline-flex items-center gap-2 text-sm text-blue-600"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách
        </Link>
      </div>
    );
  }

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
          Người thuê: {room.tenant}
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
          {readings.map((reading, index) => {
            const isElectricity = reading.type === "ELECTRICITY";
            const Icon = isElectricity ? Zap : Droplets;
            const unit = isElectricity ? "kWh" : "m³";
            const consumption = reading.newValue - reading.oldValue;

            return (
              <section
                key={reading.type}
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
                        Gửi lúc {reading.submittedAt}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(reading.status)}`}
                  >
                    {statusLabel(reading.status)}
                  </span>
                </div>

                <div className="grid gap-5 p-4 md:grid-cols-2">
                  {/* Ảnh đồng hồ */}
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Ảnh đồng hồ người thuê gửi
                    </p>

                    {reading.imageUrl ? (
                      <img
                        src={reading.imageUrl}
                        alt={`Ảnh đồng hồ ${isElectricity ? "điện" : "nước"}`}
                        className="max-h-72 w-full rounded-lg border object-contain"
                      />
                    ) : (
                      <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-6 text-center">
                        <ImageIcon className="size-10 text-muted-foreground" />
                        <p className="mt-3 text-sm font-medium">
                          Ảnh minh họa chưa được cung cấp
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Khi kết nối API, hiển thị ảnh từ image_url tại đây.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Số liệu */}
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
                        {consumption.toLocaleString("vi-VN")} {unit}
                      </p>
                      <p className="mt-1 text-xs text-blue-700">
                        {reading.newValue} − {reading.oldValue}
                      </p>
                    </div>

                    {reading.note && (
                      <div className="rounded-lg border p-3">
                        <p className="text-sm font-medium">
                          Ghi chú / lý do từ chối
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {reading.note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Duyệt báo cáo */}
                <div className="border-t bg-muted/20 p-4">
                  {reading.status === "PENDING" ? (
                    rejectingIndex === index ? (
                      <div className="space-y-3">
                        <label
                          htmlFor={`reason-${index}`}
                          className="text-sm font-medium"
                        >
                          Lý do từ chối
                        </label>
                        <textarea
                          id={`reason-${index}`}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Ví dụ: Ảnh mờ, không đọc được chỉ số..."
                          className="min-h-24 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingIndex(null);
                              setRejectionReason("");
                            }}
                            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => rejectReading(index)}
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                          >
                            Xác nhận từ chối
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingIndex(index);
                            setMessage("");
                          }}
                          className="inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="size-4" />
                          Từ chối
                        </button>
                        <button
                          type="button"
                          onClick={() => approveReading(index)}
                          className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                          <CheckCircle2 className="size-4" />
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

      <p className="text-xs text-muted-foreground">
        Đây là giao diện dữ liệu tĩnh. Thao tác duyệt và từ chối chưa lưu vào
        database; ảnh thật sẽ hiển thị sau khi kết nối API.
      </p>
    </div>
  );
}
