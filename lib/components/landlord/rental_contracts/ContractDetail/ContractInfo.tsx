
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Pencil,
  ReceiptText,
} from "lucide-react";

import type {
  RentalContractWithDetails,
} from "@/lib/api/repositories/rental_contracts/rental_contracts.repository";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ContractMeterReadings from "./ContractMeterReadings";

type ContractStatus =
  | "DRAFT"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED"
  | "COMPLETED";

type Props = {
  contract: RentalContractWithDetails;
  statusMessage: string | null;
  onUpdateStatus: (status: ContractStatus) => Promise<void>;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Bản nháp",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  ACTIVE: {
    label: "Đang hiệu lực",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  EXPIRED: {
    label: "Đã hết hạn",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  TERMINATED: {
    label: "Đã chấm dứt",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    className: "border-blue-200 bg-blue-50 text-blue-700",
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

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return "—";

  const dateString =
    typeof value === "string" ? value : value.toISOString();

  const dateOnly = dateString.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

  if (dateOnly) {
    const [year, month, day] = dateOnly.split("-");
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getStatusConfig = (status: string | null | undefined) =>
  (status && STATUS_CONFIG[status]) || {
    label: status || "Chưa cập nhật",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  };

export default function ContractInfo({
  contract,
  statusMessage,
  onUpdateStatus,
}: Props) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<ContractStatus>(contract.status as ContractStatus);

  const [updating, setUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedStatus(contract.status as ContractStatus);
  }, [contract.status]);

  const status = getStatusConfig(contract.status);

  const openEditor = () => {
    setSelectedStatus(contract.status as ContractStatus);
    setStatusError(null);
    setEditorOpen(true);
  };

  const handleConfirm = async () => {
    try {
      setUpdating(true);
      setStatusError(null);

      await onUpdateStatus(selectedStatus);

      setConfirmOpen(false);
      setEditorOpen(false);
    } catch (err) {
      setStatusError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi cập nhật trạng thái."
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <Link href="/landlord/rental_contracts">
            <Button
              variant="outline"
              size="icon"
              className="mt-1 shrink-0 bg-white"
              aria-label="Quay lại danh sách hợp đồng"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                {contract.contract_number}
              </h1>

              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Chi tiết và quản lý thông tin hợp đồng thuê phòng
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="shrink-0"
          onClick={openEditor}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Cập nhật trạng thái
        </Button>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {statusMessage}
        </div>
      )}

      {/* Status editor */}
      {editorOpen && (
        <Card className="border-primary/20 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-base font-semibold">
                Cập nhật trạng thái hợp đồng
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Thay đổi trạng thái cho hợp đồng {contract.contract_number}
              </p>
            </div>

            <div className="max-w-md space-y-2">
              <Label htmlFor="contract-status">Trạng thái mới</Label>

              <select
                id="contract-status"
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value as ContractStatus)
                }
                disabled={updating}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {statusError && (
              <p className="text-sm text-red-600">{statusError}</p>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditorOpen(false);
                  setStatusError(null);
                }}
                disabled={updating}
              >
                Hủy
              </Button>

              <Button
                onClick={() => {
                  if (selectedStatus === contract.status) {
                    setStatusError(
                      "Trạng thái mới phải khác trạng thái hiện tại."
                    );
                    return;
                  }

                  setStatusError(null);
                  setConfirmOpen(true);
                }}
                disabled={updating || selectedStatus === contract.status}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Xác nhận thay đổi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm dialog */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!updating) setConfirmOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận cập nhật trạng thái</DialogTitle>

            <DialogDescription>
              Bạn có chắc chắn muốn chuyển hợp đồng{" "}
              <span className="font-semibold text-foreground">
                {contract.contract_number}
              </span>{" "}
              từ{" "}
              <span className="font-semibold text-foreground">
                {getStatusConfig(contract.status).label}
              </span>{" "}
              sang{" "}
              <span className="font-semibold text-foreground">
                {getStatusConfig(selectedStatus).label}
              </span>
              ?
              {contract.status === "DRAFT" &&
                selectedStatus === "ACTIVE" && (
                  <span className="mt-3 block rounded-md bg-amber-50 p-3 text-amber-800">
                    Khi kích hoạt, hệ thống sẽ xử lý việc ghi nhận tiền cọc
                    theo nghiệp vụ của hợp đồng.
                  </span>
                )}
            </DialogDescription>
          </DialogHeader>

          {statusError && (
            <p className="text-sm text-red-600">{statusError}</p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={updating}
            >
              Quay lại
            </Button>

            <Button onClick={handleConfirm} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract overview */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Thông tin hợp đồng
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Banknote className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  Giá thuê mỗi tháng
                </p>
                <p className="mt-1 truncate text-lg font-bold text-blue-700">
                  {formatCurrency(String(contract.rent_price))}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngày bắt đầu</p>
                <p className="mt-1 text-lg font-bold">
                  {formatDate(contract.start_date)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngày kết thúc dự kiến</p>
                <p className="mt-1 text-lg font-bold">
                  {formatDate(contract.end_date)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                <ReceiptText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Ngày thanh toán hằng tháng
                </p>
                <p className="mt-1 text-lg font-bold">
                  Ngày {contract.billing_day}
                </p>
              </div>
            </CardContent>
          </Card>

         
        </div>
         <ContractMeterReadings
            contractId={String(contract.id)}
            roomId={String(contract.room_id)}
            contractStatus={contract.status}
            contractStartDate={contract.start_date}
          />
      </section>
    </>
  );
}
