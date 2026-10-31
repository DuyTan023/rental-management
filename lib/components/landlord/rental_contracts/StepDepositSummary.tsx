
"use client";

import {
  ClipboardList,
  House,
  UserRound,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { RentalContractFormData } from "./StepContractInfo";

import type { TenantFormData } from "./StepTenants";
import { RoomWithCurrentContract } from "@/lib/api/repositories/rooms/rooms.repository";
import { Decimal } from "@prisma/client/runtime/client";

// ============================================================
// TYPES
// ============================================================

export type DepositFormData = {
  initial_amount: string;
  status: "NOT_RECEIVED" | "RECEIVED";
  received_date: string;
  note: string;
};

type StepDepositSummaryProps = {
  deposit: DepositFormData;
  contract: RentalContractFormData;
  tenants: TenantFormData[];
  selectedRoom?: RoomWithCurrentContract;
  onDepositChange: (
    value:
      | DepositFormData
      | ((prev: DepositFormData) => DepositFormData),
  ) => void;
  onGoToStep: (step: number) => void;
};

// ============================================================
// HELPERS
// ============================================================

export const formatRoom = {
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

  // Format thời gian
  date: (date: Date | string | null) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(parsedDate);
  },
};


// ============================================================
// COMPONENT
// ============================================================

export default function StepDepositSummary({
  deposit,
  contract,
  tenants,
  selectedRoom,
  onDepositChange,
  onGoToStep,
}: StepDepositSummaryProps) {
  const rentPrice = Number(contract.rent_price) || 0;
  const depositAmount = Number(deposit.initial_amount) || 0;

  const isReceived = deposit.status === "RECEIVED";

  const handleDepositStatusChange = (
    value: "NOT_RECEIVED" | "RECEIVED",
  ) => {
    onDepositChange((prev) => ({
      ...prev,
      status: value,
      received_date:
        value === "NOT_RECEIVED" ? "" : prev.received_date,
    }));
  };

  return (
    <div className="space-y-5">
      {/* TIỀN CỌC */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5" />
            4. Xác nhận tiền cọc
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Nhập số tiền cọc theo thỏa thuận và xác nhận tình trạng nhận cọc.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Số tiền cọc */}

          <div className="space-y-2">
            <Label>
              Số tiền cọc <span className="text-red-500">*</span>
            </Label>

            <div className="relative">
              <Input
                type="number"
                min="0"
                placeholder="Ví dụ: 2000000"
                className="pr-14"
                value={deposit.initial_amount}
                onChange={(e) =>
                  onDepositChange((prev) => ({
                    ...prev,
                    initial_amount: e.target.value,
                  }))
                }
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                VNĐ
              </span>
            </div>

            <p className="text-sm font-medium text-primary">
              {formatRoom.currency(depositAmount)}
            </p>
          </div>

          {/* Trạng thái nhận cọc */}

          <div className="space-y-2">
            <Label>
              Trạng thái tiền cọc <span className="text-red-500">*</span>
            </Label>

            <Select
              value={deposit.status}
              onValueChange={(value) =>
                handleDepositStatusChange(
                  (value ?? "NOT_RECEIVED") as
                    | "NOT_RECEIVED"
                    | "RECEIVED",
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="NOT_RECEIVED">
                  Chưa nhận tiền cọc
                </SelectItem>

                <SelectItem value="RECEIVED">
                  Đã nhận tiền cọc
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ngày nhận cọc */}

          {isReceived && (
            <div className="space-y-2">
              <Label>
                Ngày nhận tiền cọc{" "}
                <span className="text-red-500">*</span>
              </Label>

              <Input
                type="date"
                value={deposit.received_date}
                onChange={(e) =>
                  onDepositChange((prev) => ({
                    ...prev,
                    received_date: e.target.value,
                  }))
                }
              />
            </div>
          )}

          {/* Ghi chú */}

          <div className="space-y-2">
            <Label>Ghi chú</Label>

            <Textarea
              rows={3}
              placeholder="Ví dụ: Khách hẹn chuyển khoản tiền cọc vào ngày mai..."
              value={deposit.note}
              onChange={(e) =>
                onDepositChange((prev) => ({
                  ...prev,
                  note: e.target.value,
                }))
              }
            />
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
            {isReceived
              ? "Tiền cọc được đánh dấu đã nhận. Vui lòng nhập ngày nhận tiền thực tế."
              : "Tiền cọc chưa được nhận. Hệ thống sẽ lưu trạng thái chờ nhận cọc."}
          </div>
        </CardContent>
      </Card>

      {/* XÁC NHẬN THÔNG TIN */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5" />
            Xác nhận thông tin hợp đồng
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Kiểm tra lại thông tin trước khi tạo hợp đồng.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* PHÒNG */}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">
                PHÒNG CHO THUÊ
              </h3>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onGoToStep(1)}
              >
                Chỉnh sửa
              </Button>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <House className="h-5 w-5" />
              </div>

              <div>
                <p className="font-semibold">
                  {selectedRoom
                    ? `Phòng ${selectedRoom.room_number}`
                    : "Chưa chọn phòng"}
                </p>

                {selectedRoom && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {formatRoom.currency(selectedRoom.area)} m² · Tối đa{" "}
                      {selectedRoom.max_occupants} người
                    </p>

                    <p className="mt-1 font-medium text-primary">
                      {formatRoom.currency(selectedRoom.listed_rent)}/tháng
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* NGƯỜI THUÊ */}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">
                NGƯỜI THUÊ
              </h3>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onGoToStep(2)}
              >
                Chỉnh sửa
              </Button>
            </div>

            <div className="space-y-2">
              {tenants.map((tenant, index) => (
                <div
                  key={tenant.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <UserRound className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {tenant.full_name || `Người thuê ${index + 1}`}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {tenant.phone || "Chưa nhập số điện thoại"}
                    </p>
                  </div>

                  <Badge
                    variant={
                      tenant.role === "REPRESENTATIVE"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {tenant.role === "REPRESENTATIVE"
                      ? "Đại diện"
                      : "Thành viên"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* HỢP ĐỒNG */}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">
                THÔNG TIN HỢP ĐỒNG
              </h3>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onGoToStep(3)}
              >
                Chỉnh sửa
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">
                  Mã hợp đồng
                </p>
                <p className="mt-1 break-all font-semibold">
                  {contract.contract_number || "Chưa nhập"}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">
                  Ngày thanh toán
                </p>
                <p className="mt-1 font-semibold">
                  Ngày {contract.billing_day || "—"} hàng tháng
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">
                  Ngày bắt đầu
                </p>
                <p className="mt-1 font-semibold">
                  {formatRoom.date(contract.start_date)}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">
                  Ngày kết thúc
                </p>
                <p className="mt-1 font-semibold">
                  {contract.end_date
                    ? formatRoom.date(contract.end_date)
                    : "Không xác định"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">
                Tiền thuê mỗi tháng
              </p>
              <p className="mt-1 font-semibold">
                {formatRoom.currency(rentPrice)}
              </p>
            </div>

            {contract.note && (
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Ghi chú</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {contract.note}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* TỔNG KẾT */}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              TỔNG KẾT TIỀN
            </h3>

            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm text-muted-foreground">
                  Tiền thuê mỗi tháng
                </span>
                <span className="font-semibold">
                  {formatRoom.currency(rentPrice)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm text-muted-foreground">
                  Tiền cọc thỏa thuận
                </span>
                <span className="font-semibold">
                  {formatRoom.currency(depositAmount)}
                </span>
              </div>

              <Separator className="my-2" />

              <div className="flex items-center justify-between gap-3 py-2">
                <span className="font-semibold">Trạng thái tiền cọc</span>

                <Badge
                  variant={isReceived ? "default" : "secondary"}
                >
                  {isReceived ? "Đã nhận" : "Chưa nhận"}
                </Badge>
              </div>

              {isReceived && deposit.received_date && (
                <div className="flex items-center justify-between gap-3 py-2">
                  <span className="text-sm text-muted-foreground">
                    Ngày nhận cọc
                  </span>
                  <span className="text-sm font-medium">
                    {formatRoom.date(deposit.received_date)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* DỊCH VỤ PHÒNG */}

          {selectedRoom && selectedRoom.room_services.length > 0 && (
            <>
              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  DỊCH VỤ PHÒNG
                </h3>

                {selectedRoom.room_services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>
                      {service.services.name}{" "}
                      <span className="text-muted-foreground">
                        ({service.services.unit})
                      </span>
                    </span>

                    <span className="font-medium">
                      {formatRoom.currency(service.services.default_unit_price)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            Vui lòng kiểm tra kỹ thông tin phòng, người thuê, hợp đồng và tiền
            cọc trước khi tạo.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
