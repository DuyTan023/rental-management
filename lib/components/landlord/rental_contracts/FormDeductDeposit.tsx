"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, MinusCircle, Wallet } from "lucide-react";

type FormDeductDepositProps = {
  id: string; // ID hợp đồng
  depositId: string; // ID khoản cọc
  initialAmount: number;
  deductedAmount: number;
  refundedAmount: number;
  createdBy?: string;
  onSuccess?: () => void;
};

export default function FormDeductDeposit({
  id,
  depositId,
  initialAmount,
  deductedAmount,
  refundedAmount,
  createdBy,
  onSuccess,
}: FormDeductDepositProps) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const remainingAmount =
    initialAmount - deductedAmount - refundedAmount;

  const amountNumber = Number(amount);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  const resetForm = () => {
    setAmount("");
    setReason("");
    setError("");
    setSuccess("");
  };

  const handleOpenChange = (value: boolean) => {
    if (loading) return;

    setOpen(value);

    if (!value) {
      setConfirmOpen(false);
      resetForm();
    }
  };

  const handlePrepareSubmit = () => {
    setError("");
    setSuccess("");

    if (!amount.trim() || !Number.isFinite(amountNumber)) {
      setError("Vui lòng nhập số tiền khấu trừ hợp lệ.");
      return;
    }

    if (amountNumber <= 0) {
      setError("Số tiền khấu trừ phải lớn hơn 0.");
      return;
    }

    if (amountNumber > remainingAmount) {
      setError("Số tiền khấu trừ vượt quá số dư cọc còn lại.");
      return;
    }

    if (!reason.trim()) {
      setError("Vui lòng nhập lý do khấu trừ.");
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirmDeduct = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/landlord/rental_contracts/${id}/contract_deposit/${depositId}/deduct`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountNumber,
            reason: reason.trim(),
            ...(createdBy ? { createdBy } : {}),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể thực hiện khấu trừ tiền cọc.",
        );
      }

      setConfirmOpen(false);
      setSuccess("Khấu trừ tiền cọc thành công.");
      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setConfirmOpen(false);
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi khấu trừ tiền cọc.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger render={
            <Button
                variant="outline"
                className="text-orange-600 hover:text-orange-700"
                disabled={remainingAmount <= 0}
            >
                <MinusCircle className="mr-2 h-4 w-4" />
                Khấu trừ tiền cọc
            </Button>
        }>
         
        </DialogTrigger>

        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-orange-500" />
              Khấu trừ tiền đặt cọc
            </DialogTitle>
            <DialogDescription>
              Nhập số tiền và lý do khấu trừ từ khoản đặt cọc của hợp đồng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  Tiền cọc ban đầu
                </span>
                <span className="font-medium">
                  {formatCurrency(initialAmount)}
                </span>
              </div>

              <div className="mt-2 flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  Đã khấu trừ
                </span>
                <span className="font-medium text-orange-600">
                  {formatCurrency(deductedAmount)}
                </span>
              </div>

              <div className="mt-2 flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  Đã hoàn trả
                </span>
                <span className="font-medium">
                  {formatCurrency(refundedAmount)}
                </span>
              </div>

              <Separator className="my-3" />

              <div className="flex justify-between gap-3">
                <span className="text-sm font-medium">
                  Số dư còn lại
                </span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deduct-amount">
                Số tiền khấu trừ (VNĐ) *
              </Label>
              <Input
                id="deduct-amount"
                type="number"
                min="1"
                max={remainingAmount}
                step="1"
                placeholder="Ví dụ: 500000"
                value={amount}
                disabled={loading}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Số tiền tối đa: {formatCurrency(remainingAmount)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deduct-reason">
                Lý do khấu trừ *
              </Label>
              <Input
                id="deduct-reason"
                placeholder="Ví dụ: Hư hỏng thiết bị..."
                value={reason}
                disabled={loading}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="deduct-note">Lưu ý</Label>
              <Textarea
                id="deduct-note"
                placeholder="Kiểm tra số tiền và lý do trước khi xác nhận."
                rows={2}
                disabled={loading}
                readOnly
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => handleOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              disabled={loading || remainingAmount <= 0}
              onClick={handlePrepareSubmit}
            >
              <MinusCircle className="mr-2 h-4 w-4" />
              Xác nhận khấu trừ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(value) => {
          if (!loading) setConfirmOpen(value);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xác nhận khấu trừ tiền cọc?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sắp khấu trừ{" "}
              <strong>{formatCurrency(amountNumber)}</strong> với lý do:{" "}
              <strong>{reason.trim()}</strong>. Thao tác này sẽ cập nhật
              khoản cọc và ghi nhận lịch sử giao dịch.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              Kiểm tra lại
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmDeduct();
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {loading ? "Đang xử lý..." : "Đồng ý khấu trừ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}