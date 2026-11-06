
"use client";

import { FormEvent, useState } from "react";

type CashPaymentFormProps = {
  invoiceId: string;
  onSuccess?: () => void;
};

export function CashPaymentForm({
  invoiceId,
  onSuccess,
}: CashPaymentFormProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const formatCurrency = (value: string) => {
    if (!value) return "";

    const number = Number(value);

    if (!Number.isFinite(number)) return "";

    return new Intl.NumberFormat("vi-VN").format(number) + " ₫";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!amount.trim()) {
      setError("Vui lòng nhập số tiền thanh toán");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
      setError("Số tiền không hợp lệ");
      return;
    }

    if (Number(amount) <= 0) {
      setError("Số tiền phải lớn hơn 0");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/landlord/invoices/${invoiceId}/payments/cash`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amount.trim(),
            note: note.trim() || undefined,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể ghi nhận thanh toán",
        );
      }

      setSuccess("Ghi nhận thanh toán thành công!");
      setAmount("");
      setNote("");

      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi thanh toán",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount */}
      <div className="space-y-2">
        <label
          htmlFor="payment-amount"
          className="text-sm font-medium text-gray-700"
        >
          Số tiền nhận được <span className="text-red-500">*</span>
        </label>

        <input
          id="payment-amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Nhập số tiền"
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
        />

        {amount && (
          <p className="text-sm text-gray-500">
            {formatCurrency(amount)}
          </p>
        )}
      </div>

      {/* Note */}
      <div className="space-y-2">
        <label
          htmlFor="payment-note"
          className="text-sm font-medium text-gray-700"
        >
          Ghi chú
        </label>

        <textarea
          id="payment-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ví dụ: Thu tiền phòng tháng 11..."
          rows={3}
          maxLength={1000}
          disabled={loading}
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
        />

        <p className="text-right text-xs text-gray-400">
          {note.length}/1000
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-600"
        >
          {success}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Đang xử lý...
          </>
        ) : (
          "Xác nhận đã nhận tiền"
        )}
      </button>
    </form>
  );
}
