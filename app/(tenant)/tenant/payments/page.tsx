
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  FileImage,
  Loader2,
  Receipt,
  Wallet,
  Upload,
  X,
} from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ======================================================
// TYPES
// ======================================================

type InvoiceStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: string | number;
  unit_price: string | number;
  subtotal: string | number;
};

type Invoice = {
  id: string;
  invoice_number: string;
  billing_month: number;
  billing_year: number;
  issue_date: string;
  due_date: string;
  total_amount: string | number;
  paid_amount: string | number;
  status: InvoiceStatus;
  note: string | null;

  rental_contracts: {
    contract_number: string;
    rooms: {
      room_number: string;
    };
  };

  invoice_items: InvoiceItem[];

  payments: {
    id: string;
    amount: string | number;
    status: "PENDING";
    transaction_ref: string | null;
    payment_date: string | null;
    proof_image_url: string | null;
  }[];
};

type Pagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type InvoiceListResponse = {
  invoices: Invoice[];
  pagination: Pagination;
};

type PaymentForm = {
  amount: string;
  transaction_ref: string;
  payment_date: string;
  proof_image_url: string;
  note: string;
};



// ======================================================
// CONSTANTS
// ======================================================

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  UNPAID: {
    label: "Chưa thanh toán",
    className: "bg-amber-100 text-amber-700",
  },
  PARTIALLY_PAID: {
    label: "Thanh toán một phần",
    className: "bg-blue-100 text-blue-700",
  },
  PAID: {
    label: "Đã thanh toán",
    className: "bg-green-100 text-green-700",
  },
  OVERDUE: {
    label: "Quá hạn",
    className: "bg-red-100 text-red-700",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "bg-gray-100 text-gray-600",
  },
};

const PAGE_SIZE = 10;

// ======================================================
// HELPERS
// ======================================================

function formatMoney(value: string | number) {
  return `${Number(value).toLocaleString("vi-VN")} đ`;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - offset)
    .toISOString()
    .slice(0, 10);
}

function getRemainingAmount(invoice: Invoice) {
  return Math.max(
    0,
    Number(invoice.total_amount) - Number(invoice.paid_amount),
  );
}

function unwrapData<T>(result: any): T {
  return (result.data?.data ?? result.data) as T;
}

// ======================================================
// COMPONENT
// ======================================================

export default function TenantPaymentsPage() {
  // Invoice list
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Pagination
  const [page, setPage] = useState(1);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Payment dialog
  const [open, setOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<Invoice | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState<PaymentForm>({
    amount: "",
    transaction_ref: "",
    payment_date: getToday(),
    proof_image_url: "",
    note: "",
  });

  // ======================================================
  // FETCH INVOICES
  // ======================================================

  const fetchInvoices = useCallback(
    async (signal: AbortSignal) => {
      try {
        setLoading(true);
        setError("");

        const query = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });

        const response = await fetch(
          `/api/tenant/invoices?${query.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Không thể tải danh sách hóa đơn.",
          );
        }

        const data = unwrapData<InvoiceListResponse>(result);

        setInvoices(data.invoices ?? []);
        setPagination(data.pagination ?? null);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setInvoices([]);
        setPagination(null);

        setError(
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi tải hóa đơn.",
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [page],
  );

  useEffect(() => {
    const controller = new AbortController();

    void fetchInvoices(controller.signal);

    return () => controller.abort();
  }, [fetchInvoices]);

  // ======================================================
  // COMPUTED DATA
  // ======================================================

  const payableInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          invoice.status === "UNPAID" ||
          invoice.status === "PARTIALLY_PAID" ||
          invoice.status === "OVERDUE",
      ),
    [invoices],
  );

  const totalRemaining = payableInvoices.reduce(
    (sum, invoice) => sum + getRemainingAmount(invoice),
    0,
  );

  const totalPayable = payableInvoices.length;

  // ======================================================
  // FORM HANDLERS
  // ======================================================

  const handleOpenPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);

    setForm({
      amount: String(getRemainingAmount(invoice)),
      transaction_ref: "",
      payment_date: getToday(),
      proof_image_url: "",
      note: "",
    });

    setFormError("");
    setSuccess("");
    setOpen(true);
  };

  const handleClosePayment = (value: boolean) => {
    if (submitting) return;

    setOpen(value);

    if (!value) {
      setSelectedInvoice(null);
      setFormError("");
    }
  };

  const handleChange = (
    field: keyof PaymentForm,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ======================================================
  // SUBMIT BANK TRANSFER REQUEST
  // ======================================================

  const handleSubmitPayment = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedInvoice) return;

    setFormError("");

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Số tiền thanh toán không hợp lệ.");
      return;
    }

    if (!form.transaction_ref.trim()) {
      setFormError("Vui lòng nhập mã giao dịch ngân hàng.");
      return;
    }

    if (!form.payment_date) {
      setFormError("Vui lòng chọn ngày chuyển khoản.");
      return;
    }

    if (!form.proof_image_url.trim()) {
      setFormError("Vui lòng nhập đường dẫn ảnh minh chứng.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/landlord/invoices/${selectedInvoice.id}/payments/bank-transfer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: form.amount,
            transaction_ref: form.transaction_ref.trim(),
            payment_date: form.payment_date,
            proof_image_url: form.proof_image_url.trim(),
            note: form.note.trim() || null,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Không thể gửi yêu cầu thanh toán.",
        );
      }

      setOpen(false);
      setSelectedInvoice(null);

      setSuccess(
        result.message ||
          "Gửi yêu cầu thanh toán thành công. Vui lòng chờ chủ trọ xác nhận.",
      );

      // Reload invoice list after submitting
      const controller = new AbortController();
      await fetchInvoices(controller.signal);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi gửi yêu cầu thanh toán.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Thanh toán hóa đơn
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Chọn hóa đơn và gửi thông tin chuyển khoản để chủ trọ
          xác nhận thanh toán.
        </p>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">{success}</div>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="text-green-700 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="h-4 w-4" />
            Hóa đơn cần thanh toán
          </div>

          <p className="mt-2 text-2xl font-bold">
            {loading ? "—" : totalPayable}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            Tổng số tiền còn lại trên trang
          </div>

          <p className="mt-2 text-2xl font-bold text-primary">
            {loading ? "—" : formatMoney(totalRemaining)}
          </p>
        </div>
      </div>

      {/* BANK TRANSFER GUIDE */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 font-semibold">
          <CreditCard className="h-5 w-5 text-primary" />
          Hướng dẫn thanh toán
        </div>

        <ol className="mt-3 space-y-2 pl-5 text-sm text-muted-foreground list-decimal">
          <li>Chọn hóa đơn bạn muốn thanh toán.</li>
          <li>Thực hiện chuyển khoản theo thông tin tài khoản chủ trọ.</li>
          <li>Nhập số tiền, mã giao dịch và ngày chuyển khoản.</li>
          <li>Gửi ảnh minh chứng giao dịch để chủ trọ kiểm tra.</li>
          <li>Chờ chủ trọ xác nhận yêu cầu thanh toán.</li>
        </ol>
      </div>

      {/* INVOICE LIST */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">
            Hóa đơn chưa thanh toán
          </h2>

          <span className="text-sm text-muted-foreground">
            {pagination
              ? `${pagination.totalItems} hóa đơn`
              : ""}
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Đang tải hóa đơn...
            </p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        ) : payableInvoices.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
            <CheckCircle2 className="mb-3 h-10 w-10 text-green-600" />

            <h3 className="font-semibold">
              Không có hóa đơn cần thanh toán
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Hiện tại bạn không có hóa đơn chưa thanh toán.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payableInvoices.map((invoice) => {
              const remaining = getRemainingAmount(invoice);
              const config = STATUS_CONFIG[invoice.status];
              const pendingPayment = invoice.payments?.[0];
              const pendingAmount = (invoice.payments ?? [])
                .filter((payment) => payment.status === "PENDING")
                .reduce((sum, payment) => sum + Number(payment.amount), 0);

              return (
                <div
                  key={invoice.id}
                  className="rounded-xl border bg-card p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* INVOICE INFO */}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">
                          {invoice.invoice_number}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
                        >
                          {config.label}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Kỳ hóa đơn:{" "}
                        <span className="font-medium text-foreground">
                          Tháng{" "}
                          {String(invoice.billing_month).padStart(2, "0")}
                          /{invoice.billing_year}
                        </span>
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Phòng{" "}
                        <span className="font-medium text-foreground">
                          {invoice.rental_contracts?.rooms?.room_number ?? "—"}
                        </span>
                        {" · "}
                        Hợp đồng{" "}
                        <span className="font-medium text-foreground">
                          {invoice.rental_contracts?.contract_number ?? "—"}
                        </span>
                      </p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Ngày lập: {formatDate(invoice.issue_date)}
                        </span>

                        <span>
                          Hạn thanh toán: {formatDate(invoice.due_date)}
                        </span>
                      </div>
                    </div>

                    {/* AMOUNT */}
                    <div className="flex flex-col gap-3 border-t pt-3 sm:min-w-[220px] sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Tổng hóa đơn
                        </p>

                        <p className="mt-1 font-semibold">
                          {formatMoney(invoice.total_amount)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Đã thanh toán (đã xác nhận)
                          </p>

                          <p className="mt-1 font-medium text-green-600">
                            {formatMoney(invoice.paid_amount)}
                          </p>
                        </div>

                        {pendingAmount > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Đã gửi yêu cầu thanh toán (chờ xác nhận)
                            </p>

                            <p className="mt-1 font-semibold text-amber-600">
                              {formatMoney(pendingAmount)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Còn phải thanh toán
                        </p>

                        <p className="mt-1 text-lg font-bold text-primary">
                          {formatMoney(remaining)}
                        </p>
                      </div>

                      {pendingPayment ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 rounded-md bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700">
                          <Clock className="h-4 w-4" />
                          Đang chờ xác nhận
                        </div>

                        <p className="text-center text-xs text-muted-foreground">
                          Bạn đã gửi yêu cầu thanh toán.
                          Vui lòng chờ chủ trọ kiểm tra.
                        </p>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        disabled={remaining <= 0}
                        onClick={() => handleOpenPayment(invoice)}
                        className="w-full"
                      >
                        Thanh toán
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {pagination.page} / {pagination.totalPages}
            {" · "}
            Tổng {pagination.totalItems} hóa đơn
          </p>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Trang trước
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage || loading}
              onClick={() =>
                setPage((prev) =>
                  Math.min(pagination.totalPages, prev + 1),
                )
              }
            >
              Trang sau
            </Button>
          </div>
        </div>
      )}

      {/* PAYMENT DIALOG */}
      <Dialog open={open} onOpenChange={handleClosePayment}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gửi yêu cầu thanh toán</DialogTitle>

            <DialogDescription>
              Nhập thông tin giao dịch chuyển khoản để chủ trọ xác nhận.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <form
              onSubmit={handleSubmitPayment}
              className="space-y-5"
            >
              {/* SELECTED INVOICE */}
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">
                  Hóa đơn
                </p>

                <p className="mt-1 font-semibold">
                  {selectedInvoice.invoice_number}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Tháng {selectedInvoice.billing_month}/
                  {selectedInvoice.billing_year}
                  {" · "}
                  Phòng{" "}
                  {selectedInvoice.rental_contracts?.rooms?.room_number ?? "—"}
                </p>

                <div className="mt-3 flex justify-between gap-3 border-t pt-3 text-sm">
                  <span className="text-muted-foreground">
                    Còn phải thanh toán
                  </span>

                  <span className="font-bold text-primary">
                    {formatMoney(getRemainingAmount(selectedInvoice))}
                  </span>
                </div>
              </div>

              {/* AMOUNT */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Số tiền chuyển khoản (VNĐ) *
                </Label>

                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    handleChange("amount", e.target.value)
                  }
                  placeholder="Nhập số tiền"
                  required
                />

                <p className="text-xs text-muted-foreground">
                  Không nhập số tiền lớn hơn số tiền còn phải thanh toán.
                  Hệ thống sẽ kiểm tra lại khi gửi yêu cầu.
                </p>
              </div>

              {/* TRANSACTION REF */}
              <div className="space-y-2">
                <Label htmlFor="transaction_ref">
                  Mã giao dịch ngân hàng *
                </Label>

                <Input
                  id="transaction_ref"
                  value={form.transaction_ref}
                  onChange={(e) =>
                    handleChange("transaction_ref", e.target.value)
                  }
                  placeholder="Nhập mã giao dịch"
                  maxLength={150}
                  required
                />
              </div>

              {/* PAYMENT DATE */}
              <div className="space-y-2">
                <Label htmlFor="payment_date">
                  Ngày chuyển khoản *
                </Label>

                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="payment_date"
                    type="date"
                    value={form.payment_date}
                    max={getToday()}
                    onChange={(e) =>
                      handleChange("payment_date", e.target.value)
                    }
                    className="pl-10"
                    required
                  />
                </div>
              </div>

      
              {/* PROOF IMAGE */}
              <div className="space-y-2">
                <Label>Ảnh minh chứng chuyển khoản *</Label>

                <CldUploadWidget
                  uploadPreset={
                    process.env.CLOUDINARY_UPLOAD_PRESET!
                  }
                  options={{
                    sources: ["local"],
                    multiple: false,
                    maxFiles: 1,
                    resourceType: "image",
                    clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
                    maxFileSize: 5_000_000,
                  }}
                  onSuccess={(result) => {
                    if (
                      typeof result.info !== "string" &&
                      result.info?.secure_url
                    ) {
                      handleChange(
                        "proof_image_url",
                        result.info.secure_url,
                      );
                      setFormError("");
                    }
                  }}
                  onError={(error) => {
                    console.error("Cloudinary upload error:", error);
                    setFormError("Tải ảnh thất bại. Vui lòng thử lại.");
                  }}
                >
                  {({ open }) => (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => open()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {form.proof_image_url
                        ? "Chọn ảnh khác"
                        : "Tải ảnh minh chứng lên"}
                    </Button>
                  )}
                </CldUploadWidget>

                {form.proof_image_url && (
                  <div className="relative rounded-lg border p-2">
                    <img
                      src={form.proof_image_url}
                      alt="Ảnh minh chứng chuyển khoản"
                      className="max-h-64 w-full rounded-md object-contain"
                    />

                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-green-600">
                        Đã tải ảnh lên Cloudinary
                      </p>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleChange("proof_image_url", "")
                        }
                      >
                        <X className="mr-1 h-4 w-4" />
                        Xóa ảnh
                      </Button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Hỗ trợ JPG, PNG, WEBP. Dung lượng tối đa 5 MB.
                </p>
              </div>


              {/* NOTE */}
              <div className="space-y-2">
                <Label htmlFor="note">
                  Ghi chú
                </Label>

                <Textarea
                  id="note"
                  value={form.note}
                  onChange={(e) =>
                    handleChange("note", e.target.value)
                  }
                  placeholder="Ghi chú thêm nếu có..."
                  maxLength={1000}
                  rows={3}
                />
              </div>

              {/* FORM ERROR */}
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              {/* PENDING NOTICE */}
              <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />

                <p>
                  Sau khi gửi, yêu cầu sẽ ở trạng thái chờ xác nhận.
                  Hóa đơn chỉ được cập nhật thanh toán khi chủ trọ xác nhận.
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => handleClosePayment(false)}
                >
                  Hủy
                </Button>

                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi yêu cầu thanh toán"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
