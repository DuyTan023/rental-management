"use client";

import {
  CheckCircle2,
  ClipboardList,
  House,
  Info,
  UserRound,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import type { RentalContractFormData } from "./StepContractInfo";
import type { RoomOption } from "./StepSelectRoom";
import type { TenantFormData } from "./StepTenants";

// ============================================================
// TYPES
// ============================================================

export type DepositFormData = {
  initial_amount: string;
  received_date: string;
  note: string;
};

type StepDepositSummaryProps = {
  deposit: DepositFormData;
  contract: RentalContractFormData;
  tenants: TenantFormData[];
  selectedRoom?: RoomOption;
  onDepositChange: (
    value: DepositFormData | ((prev: DepositFormData) => DepositFormData),
  ) => void;
  onGoToStep: (step: number) => void;
};

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value: string) {
  if (!value) return "Chưa chọn";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN").format(date);
}

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

  const totalExpected = rentPrice + depositAmount;

  return (
    <div className="space-y-5">
      {/* ======================================================
          THÔNG TIN TIỀN CỌC
      ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5" />
            4. Thông tin tiền cọc
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Nhập số tiền cọc thỏa thuận khi tạo hợp đồng.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>
              Số tiền cọc ban đầu <span className="text-red-500">*</span>
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

            <p className="text-xs text-muted-foreground">
              Tương ứng với contract_deposits.initial_amount.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ngày nhận tiền cọc</Label>

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

            <p className="text-xs text-muted-foreground">
              Để trống nếu chưa nhận tiền cọc.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ghi chú tiền cọc</Label>

            <Textarea
              rows={3}
              placeholder="Ví dụ: Hẹn nhận tiền cọc khi bàn giao phòng..."
              value={deposit.note}
              onChange={(e) =>
                onDepositChange((prev) => ({
                  ...prev,
                  note: e.target.value,
                }))
              }
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

              <div>
                <p className="font-semibold text-amber-900">
                  Lưu ý về tiền cọc
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  Số tiền cọc ban đầu không đồng nghĩa với số tiền đã nhận. Khi
                  kết nối API, cần xác định trạng thái cọc và giao dịch thu tiền
                  phù hợp với thực tế.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================
          XÁC NHẬN HỢP ĐỒNG
      ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5" />
            Xác nhận thông tin hợp đồng
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Kiểm tra lại các thông tin đã nhập trước khi tạo hợp đồng.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Phòng cho thuê */}

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

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <House className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold">
                    {selectedRoom
                      ? `Phòng ${selectedRoom.room_number}`
                      : "Chưa chọn phòng"}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {selectedRoom
                      ? `${selectedRoom.area} m² · Tối đa ${selectedRoom.max_occupants} người`
                      : "Vui lòng quay lại chọn phòng"}
                  </p>

                  {selectedRoom && (
                    <p className="mt-1 font-medium text-primary">
                      {formatCurrency(selectedRoom.listed_rent)}/tháng
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Người thuê */}

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
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
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
                      tenant.role === "REPRESENTATIVE" ? "default" : "secondary"
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

          {/* Thông tin hợp đồng */}

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
                <p className="text-sm text-muted-foreground">Mã hợp đồng</p>

                <p className="mt-1 break-all font-semibold">
                  {contract.contract_number || "Chưa nhập"}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Ngày thanh toán</p>

                <p className="mt-1 font-semibold">
                  Ngày {contract.billing_day || "—"} hàng tháng
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Ngày bắt đầu</p>

                <p className="mt-1 font-semibold">
                  {formatDate(contract.start_date)}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Ngày kết thúc</p>

                <p className="mt-1 font-semibold">
                  {contract.end_date
                    ? formatDate(contract.end_date)
                    : "Không xác định"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">
                Tiền thuê mỗi tháng
              </p>

              <p className="mt-1 font-semibold">{formatCurrency(rentPrice)}</p>
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

          {/* Tổng kết tài chính */}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              TỔNG KẾT TÀI CHÍNH
            </h3>

            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm text-muted-foreground">
                  Tiền thuê mỗi tháng
                </span>

                <span className="font-semibold">
                  {formatCurrency(rentPrice)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm text-muted-foreground">
                  Tiền cọc ban đầu
                </span>

                <span className="font-semibold">
                  {formatCurrency(depositAmount)}
                </span>
              </div>

              <Separator className="my-2" />

              <div className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="font-semibold">Tổng tiền dự kiến</p>

                  <p className="text-xs text-muted-foreground">
                    Tiền thuê tháng đầu + tiền cọc
                  </p>
                </div>

                <p className="text-lg font-bold text-primary">
                  {formatCurrency(totalExpected)}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Tổng tiền trên chỉ mang tính tham khảo, chưa bao gồm phí dịch vụ
              hoặc các khoản thu khác.
            </p>
          </div>

          {/* Dịch vụ phòng */}

          {selectedRoom && selectedRoom.services.length > 0 && (
            <>
              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  DỊCH VỤ PHÒNG
                </h3>

                {selectedRoom.services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>
                      {service.name}{" "}
                      <span className="text-muted-foreground">
                        ({service.unit})
                      </span>
                    </span>

                    <span className="font-medium">
                      {formatCurrency(service.unit_price)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Lưu ý cuối */}

          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

            <p>
              Vui lòng kiểm tra các thông tin trên. Khi triển khai thực tế, hệ
              thống cần xác thực dữ liệu, trạng thái phòng, người thuê và các
              ràng buộc hợp đồng trước khi lưu.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
