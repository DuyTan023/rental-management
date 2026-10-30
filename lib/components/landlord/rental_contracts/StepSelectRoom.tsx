"use client";

import { Building2, Droplets, House, Info, Wallet, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { RoomWithCurrentContract } from "@/lib/api/repositories/rooms/rooms.repository";
import type { Decimal } from "@prisma/client/runtime/client";

// ============================================================
// TYPES
// ============================================================

type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "INACTIVE";

type ServiceType = "METERED" | "FIXED_PER_MONTH" | "FIXED_PER_HEAD";

type StepSelectRoomProps = {
  rooms: RoomWithCurrentContract[];
  selectedRoomId: string | null;
  onSelectRoom: (room: RoomWithCurrentContract) => void;
};

// ============================================================
// HELPERS
// ============================================================

const format = {
  serviceType: (type: string) => {
    const types: Record<string, string> = {
      METERED: "Theo chỉ số",
      FIXED_PER_MONTH: "Theo tháng",
      FIXED_PER_HEAD: "Theo đầu người",
    };

    return types[type] ?? type;
  },

  // Format giá tiền
  currency: (price: Decimal | number | string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(price));
  },
};

function getRoomStatusLabel(status: RoomStatus | string) {
  const statuses: Record<string, string> = {
    AVAILABLE: "Phòng trống",
    OCCUPIED: "Đang cho thuê",
    MAINTENANCE: "Đang sửa chữa",
    INACTIVE: "Ngừng hoạt động",
  };

  return statuses[status] ?? status;
}

function getRoomStatusClass(status: RoomStatus | string) {
  const classes: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-700 hover:bg-green-100",
    OCCUPIED: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    MAINTENANCE: "bg-violet-100 text-violet-700 hover:bg-violet-100",
    INACTIVE: "bg-red-100 text-red-700 hover:bg-red-100",
  };

  return classes[status] ?? "";
}

function getServiceIcon(name: string) {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("điện")) {
    return <Zap className="h-5 w-5" />;
  }

  if (normalizedName.includes("nước")) {
    return <Droplets className="h-5 w-5" />;
  }

  return <House className="h-5 w-5" />;
}

// ============================================================
// COMPONENT
// ============================================================

export default function StepSelectRoom({
  rooms,
  selectedRoomId,
  onSelectRoom,
}: StepSelectRoomProps) {
  const selectedRoom = rooms.find((room) => String(room.id) === selectedRoomId);
  const roomItems = rooms.map((room) => ({
    label: `${room.room_number} — ${format.currency(room.listed_rent)}/tháng`,
    value: String(room.id),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <House className="h-5 w-5" />
          1. Chọn phòng cho thuê
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          Chọn phòng để xem thông tin cơ bản và dịch vụ đang được áp dụng.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>
            Phòng cho thuê <span className="text-red-500">*</span>
          </Label>
          <Select
            items={roomItems}
            value={selectedRoomId ?? ""}
            onValueChange={(roomId) => {
              const room = rooms.find((item) => String(item.id) === roomId);

              if (room) {
                onSelectRoom(room);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn phòng muốn cho thuê" />
            </SelectTrigger>

            <SelectContent>
              {roomItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {selectedRoom ? (
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold">
                  Phòng {selectedRoom.room_number}
                </h3>

                <Badge className={getRoomStatusClass(selectedRoom.status)}>
                  {getRoomStatusLabel(selectedRoom.status)}
                </Badge>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {selectedRoom.description || "Chưa có mô tả phòng."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Diện tích
                </div>

                <p className="mt-2 text-lg font-semibold">
                  {String(selectedRoom.area)} m²
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <House className="h-4 w-4" />
                  Sức chứa
                </div>

                <p className="mt-2 text-lg font-semibold">
                  {selectedRoom.max_occupants} người
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  Giá niêm yết
                </div>

                <p className="mt-2 text-lg font-semibold">
                  {format.currency(selectedRoom.listed_rent)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Dịch vụ đang áp dụng</h3>

                <p className="text-sm text-muted-foreground">
                  Các dịch vụ hiện tại của phòng.
                </p>
              </div>

              {selectedRoom.room_services.length > 0 ? (
                <div className="overflow-hidden rounded-lg border">
                  {selectedRoom.room_services.map((roomService, index) => {
                    const service = roomService.services;

                    return (
                      <div
                        key={String(roomService.id)}
                        className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                          index > 0 ? "border-t" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            {getServiceIcon(service.name)}
                          </div>

                          <div>
                            <p className="font-medium">{service.name}</p>

                            <p className="text-sm text-muted-foreground">
                              {format.serviceType(roomService.services.type)}
                            </p>
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <p className="font-semibold">
                            {format.currency(
                              roomService.services.default_unit_price,
                            )}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            / {service.unit}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <Info className="mx-auto h-8 w-8 text-muted-foreground" />

                  <p className="mt-2 font-medium">Chưa có dịch vụ</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Phòng này chưa có dịch vụ nào được áp dụng.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />

              <p>
                Giá thuê trong hợp đồng có thể khác giá niêm yết. Bạn có thể
                điều chỉnh ở bước thông tin hợp đồng.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <House className="mx-auto h-10 w-10 text-muted-foreground" />

            <p className="mt-3 font-medium">Chưa chọn phòng</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Vui lòng chọn phòng để xem thông tin chi tiết.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
