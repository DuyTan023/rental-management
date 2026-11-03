
"use client";

import Link from "next/link";
import { ArrowRight, Eye, House } from "lucide-react";

import type {
  RentalContractWithDetails,
} from "@/lib/api/repositories/rental_contracts/rental_contracts.repository";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = {
  contract: RentalContractWithDetails;
};

const ROOM_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  AVAILABLE: {
    label: "Phòng trống",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  OCCUPIED: {
    label: "Đang cho thuê",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  MAINTENANCE: {
    label: "Đang sửa chữa",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  INACTIVE: {
    label: "Ngừng hoạt động",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

const formatCurrency = (value: number | string | null | undefined) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ContractRoomInfo({ contract }: Props) {
  const room = contract.rooms;

  const roomStatus = room?.status
    ? ROOM_STATUS_CONFIG[room.status] ?? {
        label: room.status,
        className: "border-slate-200 bg-slate-100 text-slate-700",
      }
    : {
        label: "Chưa cập nhật",
        className: "border-slate-200 bg-slate-100 text-slate-700",
      };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
              <House className="h-5 w-5" />
            </div>

            <div>
              <CardTitle className="text-lg">
                Thông tin phòng thuê
              </CardTitle>
              <CardDescription>
                Phòng được sử dụng trong hợp đồng này
              </CardDescription>
            </div>
          </div>

          <Link href={`/landlord/rooms/${contract.room_id.toString()}`}>
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              Xem phòng
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm text-muted-foreground">Tên phòng</p>
          <p className="mt-1 text-lg font-bold">
            {room?.room_number ?? "Chưa cập nhật"}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Diện tích</p>
          <p className="mt-1 font-semibold">
            {room?.area != null ? `${room.area} m²` : "Chưa cập nhật"}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Sức chứa tối đa</p>
          <p className="mt-1 font-semibold">
            {room?.max_occupants != null
              ? `${room.max_occupants} người`
              : "Chưa cập nhật"}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Giá thuê niêm yết
          </p>
          <p className="mt-1 font-semibold">
            {room?.listed_rent != null
              ? formatCurrency(String(room.listed_rent))
              : "Chưa cập nhật"}
          </p>
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <Separator className="mb-4" />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Trạng thái phòng:
            </span>

            <Badge variant="outline" className={roomStatus.className}>
              {roomStatus.label}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
