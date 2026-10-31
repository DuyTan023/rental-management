"use client";

import { FileText, House, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RoomWithCurrentContract } from "@/lib/api/repositories/rooms/rooms.repository";
import { formatRoom } from "./StepSelectRoom";



// ============================================================
// TYPES
// ============================================================

export type RentalContractFormData = {
  contract_number: string;
  start_date: string;
  end_date: string;
  rent_price: string;
  billing_day: string;
  note: string;
};

type StepContractInfoProps = {
  contract: RentalContractFormData;
  selectedRoom?: RoomWithCurrentContract;
  onContractChange: (
    value:
      | RentalContractFormData
      | ((prev: RentalContractFormData) => RentalContractFormData),
  ) => void;
  onChangeRoom: () => void;
};

// ============================================================
// HELPER
// ============================================================

export function generateContractNumber(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  const dd = pad(date.getDate());
  const mm = pad(date.getMonth() + 1);
  const yy = String(date.getFullYear()).slice(-2);
  const hh = pad(date.getHours());
  const pp = pad(date.getMinutes());

  return `HD${dd}${mm}${yy}${hh}${pp}`;
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

// ============================================================
// COMPONENT
// ============================================================

export default function StepContractInfo({
  contract,
  selectedRoom,
  onContractChange,
  onChangeRoom,
}: StepContractInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          3. Thông tin hợp đồng
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          Kiểm tra mã hợp đồng, thời hạn, tiền thuê và ngày thanh toán.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mã hợp đồng */}

        <div className="space-y-2">
          <Label>Mã hợp đồng</Label>

          <Input
            value={contract.contract_number}
            readOnly
            className="bg-muted font-medium"
          />

          <p className="text-xs text-muted-foreground">
            Mã được tự động tạo theo định dạng HDddmmyyhhpp.
          </p>
        </div>

        <Separator />

        {/* Phòng đã chọn */}

        <div className="space-y-3">
          <h3 className="font-semibold">Phòng thuê</h3>

          {selectedRoom ? (
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <House className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-semibold">
                      Phòng {selectedRoom.room_number}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {formatRoom.currency(selectedRoom.area)} m² · Tối đa{" "}
                      {selectedRoom.max_occupants} người
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onChangeRoom}
                >
                  Đổi phòng
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-destructive">
              Chưa có phòng được chọn. Vui lòng quay lại bước chọn phòng.
            </p>
          )}
        </div>

        <Separator />

        {/* Thời hạn hợp đồng */}

        <div className="space-y-3">
          <h3 className="font-semibold">Thời hạn hợp đồng</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Ngày bắt đầu <span className="text-red-500">*</span>
              </Label>

              <Input
                type="date"
                value={contract.start_date}
                onChange={(e) =>
                  onContractChange((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                    end_date:
                      prev.end_date && prev.end_date < e.target.value
                        ? ""
                        : prev.end_date,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Ngày kết thúc</Label>

              <Input
                type="date"
                value={contract.end_date}
                min={contract.start_date || undefined}
                onChange={(e) =>
                  onContractChange((prev) => ({
                    ...prev,
                    end_date: e.target.value,
                  }))
                }
              />

              <p className="text-xs text-muted-foreground">
                Có thể để trống nếu hợp đồng chưa xác định ngày kết thúc.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Giá thuê và thanh toán */}

        <div className="space-y-3">
          <h3 className="font-semibold">Giá thuê và thanh toán</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Tiền thuê mỗi tháng <span className="text-red-500">*</span>
              </Label>

              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  placeholder="2000000"
                  className="pr-14"
                  value={contract.rent_price}
                  onChange={(e) =>
                    onContractChange((prev) => ({
                      ...prev,
                      rent_price: e.target.value,
                    }))
                  }
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  VNĐ
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                Giá thuê được lưu vào rental_contracts.rent_price.
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                Ngày thanh toán hàng tháng{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={contract.billing_day}
                onValueChange={(value) =>
                  onContractChange((prev) => ({
                    ...prev,
                    billing_day: value ?? "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngày thanh toán" />
                </SelectTrigger>

                <SelectContent>
                  {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      Ngày {day} hàng tháng
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">
                Ngày thanh toán được lưu vào rental_contracts.billing_day.
              </p>
            </div>
          </div>

          {contract.rent_price !== "" && (
            <div className="rounded-lg bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Tiền thuê dự kiến mỗi tháng
              </div>

              <p className="mt-1 text-2xl font-bold text-primary">
                {formatCurrency(contract.rent_price)}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Ghi chú */}

        <div className="space-y-2">
          <Label>Ghi chú hợp đồng</Label>

          <Textarea
            placeholder="Nhập các thỏa thuận bổ sung nếu có..."
            rows={4}
            value={contract.note}
            onChange={(e) =>
              onContractChange((prev) => ({
                ...prev,
                note: e.target.value,
              }))
            }
          />

          <p className="text-xs text-muted-foreground">
            Ghi nhận các thỏa thuận bổ sung giữa chủ trọ và người thuê.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}