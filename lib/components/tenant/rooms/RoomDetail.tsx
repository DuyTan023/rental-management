"use client";

import {
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  DoorOpen,
  Droplet,
  FileText,
  House,
  Maximize2,
  UserRound,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import type { ElementType } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { RoomWithCurrentContract } from "@/lib/api/repositories/rooms/rooms.repository";
import ContractRentHistory from "./ContractRentHistory";
import Link from "next/link";

type CurrentMeterReading = {
  meterType: "ELECTRICITY" | "WATER";
  currentValue: number;
  readingDate: string | Date;
  source: "INITIAL_HANDOVER" | "MONTHLY_REPORT";
};



type TenantRoomDetailProps = {
  room: RoomWithCurrentContract;
  currentReadings: CurrentMeterReading[];
};

const format = {
  currency: (price: unknown) => {
    const amount = Number(price);

    if (!Number.isFinite(amount)) {
      return "Chưa xác định";
    }

    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  },

  date: (date: Date | string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  },

  number: (value: number) => {
    return Number(value).toLocaleString("vi-VN");
  },
};

const roomStatusConfig: Record<
  string,
  { label: string; className: string }
> = {
  AVAILABLE: {
    label: "Phòng trống",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  OCCUPIED: {
    label: "Đang cho thuê",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  MAINTENANCE: {
    label: "Đang sửa chữa",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  INACTIVE: {
    label: "Ngừng hoạt động",
    className: "border-gray-200 bg-gray-100 text-gray-600",
  },
};

export default function TenantRoomDetail({
  room,
  currentReadings,
}: TenantRoomDetailProps) {
  const currentContract = room.current_contract;

  const status = roomStatusConfig[room.status] ?? {
    label: room.status,
    className: "border-gray-200 bg-gray-50 text-gray-600",
  };

  const electricityReading =
    currentReadings.find(
      (reading) => reading.meterType === "ELECTRICITY"
    ) ?? null;

  const waterReading =
    currentReadings.find(
      (reading) => reading.meterType === "WATER"
    ) ?? null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-full space-y-6">
        {/* HEADER */}
        <div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
            <House size={16} />
            <Link href = "/tenant/dashboard" className="hover:underline hover:text-blue-600"><span>Xóm Cũ</span></Link>
            <ChevronRight size={14} />
            <span className="text-blue-600">Chi tiết phòng</span>
        </div>
          <div className="flex flex-wrap items-center gap-3 mt-7">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Phòng {room.room_number}
            </h1>

            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Thông tin phòng trọ bạn đang thuê
          </p>
        </div>

        {/* ROOM SUMMARY */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={DoorOpen}
            label="Trạng thái phòng"
            value={status.label}
            description="Trạng thái hiện tại"
            iconClass="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            icon={Maximize2}
            label="Diện tích"
            value={`${room.area} m²`}
            description="Diện tích sử dụng"
            iconClass="bg-violet-50 text-violet-600"
          />

       <SummaryCard
            icon={Banknote}
            label="Giá thuê hiện tại"
            value={format.currency(room.listed_rent)}
            description="Giá thuê cơ bản mỗi tháng"
            iconClass="bg-emerald-50 text-emerald-600"
            />

          <SummaryCard
            icon={Users}
            label="Số người ở"
            value={`${currentContract?.contract_tenants.length ?? 0} người`}
            description={`Tối đa ${room.max_occupants} người`}
            iconClass="bg-orange-50 text-orange-600"
          />
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="space-y-6 lg:col-span-2">
            {/* ROOM INFORMATION */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div>
                  <CardTitle className="text-lg">
                    Thông tin phòng
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    Thông tin cơ bản về phòng bạn đang thuê
                  </p>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  <InfoItem
                    label="Mã phòng"
                    value={room.room_number}
                  />

                  <InfoItem
                    label="Diện tích"
                    value={`${room.area} m²`}
                    icon={Maximize2}
                  />

                  <InfoItem
                    label="Số người tối đa"
                    value={`${room.max_occupants} người`}
                    icon={Users}
                  />

                  <InfoItem
                    label="Trạng thái"
                    value={status.label}
                    icon={DoorOpen}
                  />


                  <div className="sm:col-span-2">
                    <p className="mb-1.5 text-sm text-slate-500">
                      Mô tả phòng
                    </p>

                    <p className="text-sm leading-6 text-slate-800">
                      {room.description ||
                        "Chưa có mô tả cho phòng này."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CURRENT CONTRACT */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Hợp đồng thuê phòng
                    </CardTitle>

                    <p className="mt-1 text-sm text-slate-500">
                      Thông tin hợp đồng thuê phòng hiện tại
                    </p>
                  </div>

                  {currentContract && (
                    <Badge
                      variant="outline"
                      className={
                        currentContract.status === "ACTIVE"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-600"
                      }
                    >
                      {currentContract.status === "ACTIVE"
                        ? "Đang hiệu lực"
                        : "Không còn hiệu lực"}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {!currentContract ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                    <FileText className="mx-auto h-9 w-9 text-slate-300" />

                    <p className="mt-3 font-medium text-slate-700">
                      Chưa có hợp đồng
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Hiện tại chưa có hợp đồng thuê phòng được liên kết.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* CONTRACT NUMBER */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                      <p className="text-sm text-slate-500">
                        Mã hợp đồng
                      </p>

                      <p className="mt-1 text-lg font-semibold text-blue-700">
                        {currentContract.contract_number}
                      </p>
                    </div>

                    {/* CONTRACT INFORMATION */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <InfoItem
                        label="Ngày bắt đầu"
                        value={format.date(currentContract.start_date)}
                        icon={CalendarDays}
                      />

                      <InfoItem
                        label="Ngày kết thúc"
                        value={
                          currentContract.end_date
                            ? format.date(currentContract.end_date)
                            : "Không xác định"
                        }
                        icon={CalendarDays}
                      />

                      <InfoItem
                        label="Tiền thuê hàng tháng theo hợp đồng"
                        value={format.currency(currentContract.rent_price)}
                        icon={Banknote}
                      />

                      <InfoItem
                        label="Ngày thanh toán hàng tháng"
                        value={`Ngày ${currentContract.billing_day}`}
                        icon={CalendarDays}
                      />
                    </div>

                    {/* TENANTS */}
                    <div className="border-t border-slate-100 pt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">
                          Thành viên cùng phòng
                        </h3>

                        <Badge variant="secondary">
                          {currentContract.contract_tenants.length} người
                        </Badge>
                      </div>

                      {currentContract.contract_tenants.length === 0 ? (
                        <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                          Chưa có thành viên được ghi nhận.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {currentContract.contract_tenants.map((tenant) => (
                            <div
                              key={tenant.id}
                              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
                            >
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                <UserRound className="h-5 w-5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-slate-800">
                                  {tenant.profiles.full_name}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  {tenant.profiles.phone || "Chưa cập nhật số điện thoại"}
                                </p>
                              </div>

                              {tenant.role === "REPRESENTATIVE" && (
                                <Badge className="shrink-0 border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-50">
                                  Đại diện
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SERVICES */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div>
                  <CardTitle className="text-lg">
                    Dịch vụ đang sử dụng
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    Các dịch vụ được áp dụng cho phòng của bạn
                  </p>
                </div>
              </CardHeader>

              <CardContent>
                {room.room_services.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                    <p className="text-sm text-slate-500">
                      Phòng chưa được áp dụng dịch vụ nào.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {room.room_services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                          <Zap className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800">
                            {service.services.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Đơn vị: {service.services.unit}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-slate-800">
                            {format.currency(
                              service.services.default_unit_price
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            / {service.services.unit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* ROOM STATUS */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Trạng thái phòng
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-slate-100 p-3">
                    {room.status === "MAINTENANCE" ? (
                      <Wrench className="h-5 w-5 text-amber-600" />
                    ) : room.status === "AVAILABLE" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <DoorOpen className="h-5 w-5 text-blue-600" />
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-800">
                      {status.label}
                    </p>

                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      {room.status === "AVAILABLE" &&
                        "Phòng hiện đang ở trạng thái trống."}

                      {room.status === "OCCUPIED" &&
                        "Bạn đang thuê và sử dụng phòng này."}

                      {room.status === "MAINTENANCE" &&
                        "Phòng đang trong quá trình sửa chữa."}

                      {room.status === "INACTIVE" &&
                        "Phòng hiện không được đưa vào hoạt động."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* METER READINGS */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Chỉ số điện nước
                </CardTitle>

                <p className="text-sm text-slate-500">
                  Chỉ số ghi nhận gần nhất
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* ELECTRICITY */}
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-600" />

                    <p className="font-medium text-slate-700">
                      Điện
                    </p>
                  </div>

                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {electricityReading
                      ? format.number(Number(electricityReading.currentValue))
                      : "--"}
                    <span className="ml-1 text-sm font-medium text-slate-500">
                      kWh
                    </span>
                  </p>

                  {electricityReading && (
                    <p className="mt-2 text-xs text-slate-500">
                      Cập nhật: {format.date(electricityReading.readingDate)}
                    </p>
                  )}
                </div>

                {/* WATER */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <Droplet className="h-5 w-5 text-blue-600" />

                    <p className="font-medium text-slate-700">
                      Nước
                    </p>
                  </div>

                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {waterReading
                      ? format.number(Number(waterReading.currentValue))
                      : "--"}
                    <span className="ml-1 text-sm font-medium text-slate-500">
                      m³
                    </span>
                  </p>

                  {waterReading && (
                    <p className="mt-2 text-xs text-slate-500">
                      Cập nhật: {format.date(waterReading.readingDate)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CONTRACT RENT HISTORY */}
            {currentContract && (
            <ContractRentHistory
                contractId={String(currentContract.id)}
            />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* SUMMARY CARD */

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
}: {
  icon: ElementType;
  label: string;
  value: string;
  description: string;
  iconClass: string;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start gap-3 p-5">
        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500">{label}</p>

          <p className="mt-1 break-words text-xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* INFO ITEM */

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: ElementType;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 flex items-center gap-2 text-sm text-slate-500">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </p>

      <p className="break-words font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}