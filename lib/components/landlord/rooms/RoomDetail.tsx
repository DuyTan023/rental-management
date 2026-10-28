"use client";

import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  DoorOpen,
  FileText,
  Maximize2,
  Pencil,
  UserRound,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { room_services } from "@/generated/prisma/client";
import {
  CurrentContract,
  RoomWithCurrentContract,
} from "@/lib/api/repositories/rooms/rooms.repository";
import { Decimal } from "@prisma/client/runtime/client";
import Link from "next/link";
import { FormUpdateRoom } from "./FormUpdateRoom";
import { FormUpdateStatusRoom } from "./FormUpdateStatusRoom";

type RoomDetailProps = {
  room: RoomWithCurrentContract;
};

const format = {
  // Format trạng thái phòng
  roomStatus: (status: string) => {
    const statuses: Record<string, string> = {
      AVAILABLE: "Phòng trống",
      OCCUPIED: "Đang cho thuê",
      MAINTENANCE: "Đang sửa chữa",
      INACTIVE: "Ngừng hoạt động",
    };

    return statuses[status] ?? status;
  },

  // Format giá tiền
  currency: (price: Decimal | number | string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(price));
  },

  // Format thời gian
  date: (date: Date | string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  },
};

const roomStatusConfig: Record<string, { label: string; className: string }> = {
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

export default function RoomDetail({ room }: RoomDetailProps) {
  // Chia nhỏ kết quả để quản lý
  const [roomServices, setRoomServices] = useState<room_services[]>(
    room.room_services,
  );
  const [currentContract, setCurrentContract] =
    useState<CurrentContract | null>(room.current_contract);
  const status = roomStatusConfig[room.status] ?? {
    label: room.status,
    className: "border-gray-200 bg-gray-50 text-gray-600",
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-full space-y-6 ">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="outline"
              size="icon"
              className="mt-1 shrink-0 bg-white"
              aria-label="Quay lại"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Phòng {room.room_number}
                </h1>

                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Chi tiết và thông tin quản lý phòng trọ
              </p>
            </div>
          </div>

          <FormUpdateRoom
            room={room}
            trigger={
              <Button
                size="sm"
                className="h-8 border border-blue-500/20 bg-gradient-to-r from-blue-700 to-indigo-700 text-xs font-semibold text-white shadow-md shadow-blue-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-800 hover:to-indigo-800 hover:shadow-lg hover:shadow-blue-900/30"
              >
                <Pencil className="mr-1.5 size-3.5" />
                Cập nhật thông tin phòng
              </Button>
            }
          />
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
            label="Giá thuê niêm yết"
            value={format.currency(room.listed_rent)}
            description="Giá thuê cơ bản mỗi tháng"
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            icon={Users}
            label="Số người tối đa"
            value={`${room.max_occupants} người`}
            description={`${currentContract?.contract_tenants.length} người trong hợp đồng hiện tại`}
            iconClass="bg-orange-50 text-orange-600"
          />
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="space-y-6 lg:col-span-2">
            {/* ROOM INFORMATION */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    Thông tin chung của phòng trọ
                  </p>
                </div>

                <FormUpdateRoom
                  room={room}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-slate-600"
                    >
                      <Pencil className="h-4 w-4" />
                      Chỉnh sửa
                    </Button>
                  }
                />
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  <InfoItem label="Mã phòng" value={room.room_number} />

                  <InfoItem label="Diện tích" value={`${room.area} m²`} />

                  <InfoItem
                    label="Giá thuê niêm yết"
                    value={format.currency(room.listed_rent)}
                  />

                  <InfoItem
                    label="Số người tối đa"
                    value={`${room.max_occupants} người`}
                  />

                  <div className="sm:col-span-2">
                    <p className="mb-1.5 text-sm text-slate-500">Mô tả</p>
                    <p className="text-sm leading-6 text-slate-800">
                      {room.description || "Chưa có mô tả cho phòng này."}
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
                      Hợp đồng hiện tại
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      Thông tin thuê phòng và người đang ở
                    </p>
                  </div>

                  {currentContract && (
                    <Badge
                      variant="outline"
                      className={
                        currentContract.status
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-600"
                      }
                    >
                      {currentContract.status
                        ? "Đang hiệu lực"
                        : currentContract.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {!currentContract ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                    <FileText className="mx-auto h-9 w-9 text-slate-300" />
                    <p className="mt-3 font-medium text-slate-700">
                      Chưa có hợp đồng hiện tại
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Phòng chưa có hợp đồng được liên kết.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                      <p className="text-sm text-slate-500">Số hợp đồng</p>

                      <p className="mt-1 text-lg font-semibold text-blue-700">
                        {currentContract.contract_number}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            : "Chưa xác định"
                        }
                        icon={CalendarDays}
                      />

                      <InfoItem
                        label="Tiền thuê theo hợp đồng"
                        value={format.currency(currentContract.rent_price)}
                        icon={Banknote}
                      />

                      <InfoItem
                        label="Ngày thanh toán hàng tháng"
                        value={`Ngày ${currentContract.billing_day}`}
                        icon={CalendarDays}
                      />
                    </div>

                    <div className="border-t border-slate-100 pt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">
                          Danh sách người ở
                        </h3>

                        <Badge variant="secondary">
                          {currentContract.contract_tenants.length} người
                        </Badge>
                      </div>

                      {currentContract.contract_tenants.length === 0 ? (
                        <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                          Chưa có người ở được ghi nhận trong hợp đồng.
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
                                  {tenant.profiles.phone}
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
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">
                      Dịch vụ đang sử dụng
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      Các dịch vụ đang được áp dụng cho phòng
                    </p>
                  </div>

                  <Link href={`/landlord/rooms/${room.id}/services`}>
                    <p className="text-blue-600 text-sm">Chi tiết</p>
                  </Link>
                </div>
              </CardHeader>

              <CardContent>
                {room.room_services.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                    <p className="text-sm text-slate-500">
                      Phòng chưa được gán dịch vụ nào.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {room.room_services.map((service) => {
                      return (
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

                            <p className="mt-1 text-sm text-slate-500"></p>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-slate-800">
                              {format.currency(service.unit_price)}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              / {service.services.unit}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* STATUS CARD */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Trạng thái phòng</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
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
                        "Phòng sẵn sàng để tiếp nhận người thuê."}

                      {room.status === "OCCUPIED" &&
                        "Phòng đang có người thuê."}

                      {room.status === "MAINTENANCE" &&
                        "Phòng đang trong quá trình sửa chữa."}

                      {room.status === "INACTIVE" &&
                        "Phòng hiện không được đưa vào hoạt động."}
                    </p>
                  </div>
                </div>

                {status.label === "OCCUPIED" && (
                  <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-800">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Phòng có hợp đồng đang hiệu lực. Hãy kiểm tra hợp đồng
                      trước khi thay đổi trạng thái.
                    </p>
                  </div>
                )}

                <FormUpdateStatusRoom
                  room={room}
                  trigger={
                    <Button variant="outline" className="w-full gap-2">
                      <Pencil className="h-4 w-4" />
                      Cập nhật trạng thái
                    </Button>
                  }
                />
              </CardContent>
            </Card>
            {/* QUICK INFO */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Tóm tắt phòng</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <QuickInfo
                  label="Người đang ở"
                  value={`${currentContract?.contract_tenants.length} người`}
                />

                <QuickInfo
                  label="Dịch vụ đang áp dụng"
                  value={`${room.room_services.length} dịch vụ`}
                />

                <QuickInfo
                  label="Hợp đồng hiện tại"
                  value={
                    currentContract
                      ? currentContract.contract_number
                      : "Chưa có"
                  }
                />

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs leading-5 text-slate-500">
                    Giá thuê niêm yết có thể khác giá thuê thực tế được ghi
                    trong hợp đồng.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
}: {
  icon: React.ElementType;
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

          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 flex items-center gap-2 text-sm text-slate-500">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </p>

      <p className="break-words font-medium text-slate-800">{value}</p>
    </div>
  );
}

function QuickInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="break-all text-right text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}
