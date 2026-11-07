
"use client";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  Printer,
  Wallet,
  Ban,
  Loader2,
  User,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "PAYOS";

type InvoiceItem = {
  id: string;
  service_id: string | null;
  meter_reading_id: string | null;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  subtotal: number | string;

  services?: {
    name: string;
    unit: string;
    type: string;
  } | null;

  meter_readings?: {
    old_value: number | string;
    new_value: number | string;
    consumption: number | string | null;
    reading_date: string;
  } | null;
};

type InvoiceDetail = {
  id: string;
  invoice_number: string;
  billing_month: number;
  billing_year: number;
  issue_date: string;
  due_date: string;
  total_amount: number | string;
  paid_amount: number | string;
  remaining_amount?: number | string;
  status: InvoiceStatus;
  note: string | null;
  pdf_url: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null; 

  rental_contracts: {
    id: string;
    contract_number: string;
    start_date: string;
    end_date: string | null;
    rent_price: number | string;

    rooms: {
      room_number: string;
      address?: string | null;
    };

    contract_tenants: {
      role: string;
      joined_at: string;
      left_at: string | null;
      profiles: {
        full_name: string;
        phone?: string | null;
        email?: string | null;
      };
    }[];
  };

  invoice_items: InvoiceItem[];
};

type Payment = {
  id: string;
  invoice_id: string;

  payer: {
    id: string;
    full_name: string;
    phone: string;
  } | null;

  created_by: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;

  amount: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_ref: string | null;
  payos_order_code: string | null;
  payment_date: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  proof_image_url: string | null;
  rejection_reason: string | null;
};

type PaymentHistoryData = {
  invoice: {
    id: string;
    invoice_number: string;
    total_amount: string;
    paid_amount: string;
    remaining_amount: string;
    status: InvoiceStatus;
  };

  summary: {
    successful_payment_count: number;
    successful_payment_amount: string;
  };

  payments: Payment[];

  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

// ======================================================
// CONSTANTS
// ======================================================

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "SUCCESS", label: "Thành công" },
  { value: "PENDING", label: "Đang chờ" },
  { value: "FAILED", label: "Thất bại" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "REFUNDED", label: "Đã hoàn tiền" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "Tất cả phương thức" },
  { value: "CASH", label: "Tiền mặt" },
  { value: "BANK_TRANSFER", label: "Chuyển khoản" },
  { value: "PAYOS", label: "PayOS" },
];

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  SUCCESS: "Thành công",
  PENDING: "Đang chờ",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

const PAYMENT_STATUS_CLASSES: Record<PaymentStatus, string> = {
  SUCCESS: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
  REFUNDED: "bg-blue-100 text-blue-700",
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  PAYOS: "PayOS",
};

// ======================================================
// HELPERS
// ======================================================

function formatMoney(value: number | string) {
  return `${Number(value).toLocaleString("vi-VN")} đ`;
}

function formatNumber(value: number | string) {
  return Number(value).toLocaleString("vi-VN");
}

function formatDate(value: string | null) {
  if (!value) return "Không xác định";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getInvoiceStatusLabel(status: InvoiceStatus) {
  const labels: Record<InvoiceStatus, string> = {
    UNPAID: "Chưa thanh toán",
    PARTIALLY_PAID: "Thanh toán một phần",
    PAID: "Đã thanh toán",
    OVERDUE: "Quá hạn",
    CANCELLED: "Đã hủy",
  };

  return labels[status];
}

function getInvoiceStatusClass(status: InvoiceStatus) {
  const classes: Record<InvoiceStatus, string> = {
    UNPAID: "bg-amber-100 text-amber-700",
    PARTIALLY_PAID: "bg-blue-100 text-blue-700",
    PAID: "bg-green-100 text-green-700",
    OVERDUE: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-600",
  };

  return classes[status];
}

function unwrapData<T>(result: any): T {
  return (result.data?.data ?? result.data) as T;
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    const result = await response.json();
    return result.message || "Đã xảy ra lỗi.";
  }

  return "Không thể xử lý yêu cầu. Vui lòng thử lại.";
}

// ======================================================
// STATUS BADGE
// ======================================================

function PaymentStatusBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${PAYMENT_STATUS_CLASSES[status]}`}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}

// ======================================================
// MAIN PAGE
// ======================================================

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = params.id;

  // Invoice
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // PDF
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");

  // Payment history
  const [paymentData, setPaymentData] =
    useState<PaymentHistoryData | null>(null);

  const [paymentLoading, setPaymentLoading] = useState(true);
  const [paymentError, setPaymentError] = useState("");

  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Cash payment
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [cashNote, setCashNote] = useState("");
  const [cashLoading, setCashLoading] = useState(false);
  const [cashError, setCashError] = useState("");

  // Bank transfer review
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const [confirmBankDialogOpen, setConfirmBankDialogOpen] = useState(false);
  const [rejectBankDialogOpen, setRejectBankDialogOpen] = useState(false);

  const [rejectReason, setRejectReason] = useState("");
  const [bankActionLoading, setBankActionLoading] = useState(false);
  const [bankActionError, setBankActionError] = useState("");

  // ====================================================
  // FETCH INVOICE
  // ====================================================

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/landlord/invoices/${encodeURIComponent(invoiceId)}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Không thể tải chi tiết hóa đơn."
        );
      }

      const data = unwrapData<InvoiceDetail>(result);
      setInvoice(data);
    } catch (error) {
      console.error("Fetch invoice detail:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi tải hóa đơn."
      );

      setInvoice(null);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // ====================================================
  // FETCH PAYMENT HISTORY
  // ====================================================

  const fetchPayments = useCallback(async () => {
    if (!invoiceId) return;

    try {
      setPaymentLoading(true);
      setPaymentError("");

      const query = new URLSearchParams({
        page: String(paymentPage),
        limit: "10",
      });

      if (paymentStatus) {
        query.set("status", paymentStatus);
      }

      if (paymentMethod) {
        query.set("payment_method", paymentMethod);
      }

      const response = await fetch(
        `/api/landlord/invoices/${encodeURIComponent(invoiceId)}/payments?${query.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Không thể tải lịch sử thanh toán."
        );
      }

      const data = unwrapData<PaymentHistoryData>(result);
      setPaymentData(data);
    } catch (error) {
      console.error("Fetch payment history:", error);

      setPaymentError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi tải lịch sử thanh toán."
      );

      setPaymentData(null);
    } finally {
      setPaymentLoading(false);
    }
  }, [invoiceId, paymentPage, paymentStatus, paymentMethod]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // ====================================================
  // EXPORT PDF
  // ====================================================

  const handleExportPdf = async () => {
    // Mở tab ngay trong thao tác click để tránh popup blocker.
    const newTab = window.open("", "_blank");

    if (!newTab) {
      setPdfError(
        "Trình duyệt đang chặn cửa sổ mới. Hãy cho phép popup."
      );
      return;
    }

    try {
      setExportingPdf(true);
      setPdfError("");

      newTab.document.title = "Đang tạo hóa đơn PDF...";
      newTab.document.body.innerHTML =
        "<p style='font-family:sans-serif;padding:24px'>Đang tải hóa đơn PDF...</p>";

      const response = await fetch(
        `/api/landlord/invoices/${encodeURIComponent(invoiceId)}/pdf`
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      newTab.location.href = url;

      // Giữ URL đủ lâu để trình duyệt tải và hiển thị PDF.
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error("Export invoice PDF:", error);

      newTab.close();

      setPdfError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi xuất hóa đơn PDF."
      );
    } finally {
      setExportingPdf(false);
    }
  };

  // ====================================================
  // PRINT INVOICE
  // ====================================================

  const handlePrint = () => {
    window.print();
  };

  const handleCancelInvoice = async () => {
    const reason = cancelReason.trim();

    if (!reason) {
      setCancelError("Vui lòng nhập lý do hủy hóa đơn.");
      return;
    }

    if (reason.length > 1000) {
      setCancelError("Lý do hủy không được vượt quá 1000 ký tự.");
      return;
    }

    try {
      setCancelling(true);
      setCancelError("");

      const response = await fetch(
        `/api/landlord/invoices/${encodeURIComponent(invoiceId)}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể hủy hóa đơn.");
      }

      const data = unwrapData<{
        status: InvoiceStatus;
        cancelled_at: string | null;
        cancellation_reason: string | null;
      }>(result);

      setInvoice((prev) =>
        prev
          ? {
              ...prev,
              status: "CANCELLED",
              cancelled_at: data.cancelled_at ?? new Date().toISOString(),
              cancellation_reason:
                data.cancellation_reason ?? reason,
            }
          : prev,
      );

      setCancelDialogOpen(false);
      setCancelReason("");
    } catch (error) {
      console.error("Cancel invoice:", error);

      setCancelError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi hủy hóa đơn.",
      );
    } finally {
      setCancelling(false);
    }
  };


  // ====================================================
// CASH PAYMENT
// ====================================================

  const handleCashPayment = async () => {
    const amount = cashAmount.trim();
    const note = cashNote.trim();

    setCashError("");

    if (!amount) {
      setCashError("Vui lòng nhập số tiền nhận được.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
      setCashError("Số tiền không hợp lệ.");
      return;
    }

    if (note.length > 1000) {
      setCashError("Ghi chú không được vượt quá 1000 ký tự.");
      return;
    }

    try {
      setCashLoading(true);

      const response = await fetch(
        `/api/landlord/invoices/${encodeURIComponent(invoiceId)}/payments/cash`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            note: note || undefined,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể ghi nhận thanh toán.",
        );
      }

      // Đóng dialog và reset form
      setCashDialogOpen(false);
      setCashAmount("");
      setCashNote("");
      setCashError("");

      // Tải lại chi tiết hóa đơn và lịch sử thanh toán
      await Promise.all([
        fetchInvoice(),
        fetchPayments(),
      ]);
    } catch (error) {
      console.error("Cash payment:", error);

      setCashError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi ghi nhận thanh toán.",
      );
    } finally {
      setCashLoading(false);
    }
  };

  const handleConfirmBankTransfer = async () => {
    if (!selectedPayment) return;

    try {
      setBankActionLoading(true);
      setBankActionError("");

      const response = await fetch(
        `/api/landlord/payments/${encodeURIComponent(selectedPayment.id)}/confirm`,
        { method: "PATCH" }
      );

      const result = await response.json();

      // API confirm hiện tại trả message + data, không có success.
      if (!response.ok) {
        throw new Error(result.message || "Không thể xác nhận giao dịch.");
      }

      setConfirmBankDialogOpen(false);
      setSelectedPayment(null);

      await Promise.all([fetchInvoice(), fetchPayments()]);
    } catch (error) {
      console.error("Confirm bank transfer:", error);
      setBankActionError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi xác nhận giao dịch."
      );
    } finally {
      setBankActionLoading(false);
    }
  };

  const handleRejectBankTransfer = async () => {
    if (!selectedPayment) return;

    const reason = rejectReason.trim();

    if (!reason) {
      setBankActionError("Vui lòng nhập lý do từ chối.");
      return;
    }

    if (reason.length > 1000) {
      setBankActionError("Lý do từ chối không được vượt quá 1000 ký tự.");
      return;
    }

    try {
      setBankActionLoading(true);
      setBankActionError("");

      const response = await fetch(
        `/api/landlord/payments/${encodeURIComponent(selectedPayment.id)}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Không thể từ chối giao dịch.");
      }

      setRejectBankDialogOpen(false);
      setSelectedPayment(null);
      setRejectReason("");

      await Promise.all([fetchInvoice(), fetchPayments()]);
    } catch (error) {
      console.error("Reject bank transfer:", error);
      setBankActionError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi từ chối giao dịch."
      );
    } finally {
      setBankActionLoading(false);
    }
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="flex min-h-60 items-center justify-center gap-2 p-6 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Đang tải thông tin hóa đơn...
      </div>
    );
  }

  // ====================================================
  // ERROR
  // ====================================================

  if (error || !invoice) {
    return (
      <div className="space-y-4 p-6">
        <Link
          href="/landlord/invoices"
          className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách
        </Link>

        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="size-5 shrink-0" />
          {error || "Không tìm thấy hóa đơn."}
        </div>

        <button
          onClick={fetchInvoice}
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
        >
          Thử tải lại
        </button>
      </div>
    );
  }

  // ====================================================
  // COMPUTED DATA
  // ====================================================

  const contract = invoice.rental_contracts;

  const remainingAmount =
    invoice.remaining_amount !== undefined
      ? Number(invoice.remaining_amount)
      : Number(invoice.total_amount) - Number(invoice.paid_amount);

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ================================================
          HEADER
      ================================================ */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <Link
            href="/landlord/invoices"
            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Quay lại danh sách hóa đơn
          </Link>

          <h1 className="text-2xl font-bold tracking-tight">
            Chi tiết hóa đơn
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Kiểm tra các khoản phí và thông tin thanh toán.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {invoice.status !== "CANCELLED" &&
            Number(invoice.paid_amount) === 0 && (
              <button
                onClick={() => {
                  setCancelReason("");
                  setCancelError("");
                  setCancelDialogOpen(true);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 px-4 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Ban className="size-4" />
                Hủy hóa đơn
              </button>
            )}
          {invoice.pdf_url && (
            <a
              href={invoice.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
            >
              <FileText className="size-4" />
              PDF đã lưu
            </a>
          )}

          {/* <button
            onClick={handlePrint}
            className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
          >
            <Printer className="size-4" />
            In hóa đơn
          </button> */}

          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exportingPdf ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}

            {exportingPdf ? "Đang xuất..." : "Xem hóa đơn PDF"}
          </button>

          {invoice.status !== "CANCELLED" &&
            remainingAmount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCashAmount("");
                  setCashNote("");
                  setCashError("");
                  setCashDialogOpen(true);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700"
              >
                <Wallet className="size-4" />
                Ghi nhận thanh toán
              </button>
            )}
        </div>
      </div>

      {pdfError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 print:hidden">
          <AlertCircle className="size-4 shrink-0" />
          {pdfError}
        </div>
      )}

      {/* ================================================
          INVOICE INFORMATION
      ================================================ */}

      <div
        id="invoice-print-area"
        className="space-y-6 rounded-xl border bg-white p-5"
      >
        {/* Invoice header */}

        <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="size-6 text-blue-600" />

              <h2 className="text-lg font-bold">
                HÓA ĐƠN TIỀN PHÒNG
              </h2>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Mã hóa đơn:{" "}
              <span className="font-semibold text-foreground">
                {invoice.invoice_number}
              </span>
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Kỳ hóa đơn:{" "}
              <span className="font-medium text-foreground">
                Tháng {String(invoice.billing_month).padStart(2, "0")}/
                {invoice.billing_year}
              </span>
            </p>
          </div>

          <div className="space-y-2 sm:text-right">
            <span
              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getInvoiceStatusClass(invoice.status)}`}
            >
              {getInvoiceStatusLabel(invoice.status)}
            </span>

            <p className="text-sm text-muted-foreground">
              Ngày lập: {formatDate(invoice.issue_date)}
            </p>

            <p className="text-sm text-muted-foreground">
              Hạn thanh toán: {formatDate(invoice.due_date)}
            </p>

            {invoice.status === "CANCELLED" && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 font-semibold text-red-700">
                  <Ban className="size-4" />
                  Hóa đơn đã bị hủy
                </div>

                {invoice.cancelled_at && (
                  <p className="mt-2 text-sm text-red-700">
                    Thời gian hủy: {formatDate(invoice.cancelled_at)}
                  </p>
                )}

                {invoice.cancellation_reason && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-red-700">
                      Lý do hủy:
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-red-600">
                      {invoice.cancellation_reason}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ================================================
            CONTRACT & TENANTS
        ================================================ */}

        <div className="grid gap-6 py-2 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="font-semibold">
              Thông tin phòng và hợp đồng
            </h3>

            <InfoRow
              label="Phòng"
              value={contract.rooms.room_number}
            />

            <InfoRow
              label="Mã hợp đồng"
              value={contract.contract_number}
            />

            <InfoRow
              label="Ngày bắt đầu"
              value={formatDate(contract.start_date)}
            />

            <InfoRow
              label="Ngày kết thúc"
              value={formatDate(contract.end_date)}
            />

            {contract.rooms.address && (
              <InfoRow
                label="Địa chỉ"
                value={contract.rooms.address}
              />
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">
              Thông tin người thuê
            </h3>

            {contract.contract_tenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có thông tin người thuê.
              </p>
            ) : (
              contract.contract_tenants.map((tenant, index) => (
                <div
                  key={`${tenant.profiles.full_name}-${index}`}
                  className="rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">
                      {tenant.profiles.full_name}
                    </p>

                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                      {tenant.role === "REPRESENTATIVE"
                        ? "Đại diện"
                        : "Thành viên"}
                    </span>
                  </div>

                  {tenant.profiles.phone && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Điện thoại: {tenant.profiles.phone}
                    </p>
                  )}

                  {tenant.profiles.email && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Email: {tenant.profiles.email}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ================================================
            INVOICE ITEMS
        ================================================ */}

        <div className="border-t pt-5">
          <div className="mb-4">
            <h3 className="font-semibold">
              Chi tiết các khoản phí
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Các khoản phí được lưu theo đơn giá tại thời điểm lập hóa đơn.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3 font-medium">STT</th>
                  <th className="p-3 font-medium">Nội dung</th>
                  <th className="p-3 text-right font-medium">
                    Số lượng
                  </th>
                  <th className="p-3 text-right font-medium">
                    Đơn giá
                  </th>
                  <th className="p-3 text-right font-medium">
                    Thành tiền
                  </th>
                  <th className="px-4 py-3 text-center font-medium">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {invoice.invoice_items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="p-3">{index + 1}</td>

                    <td className="p-3">
                      <p className="font-medium">
                        {item.description}
                      </p>

                      {item.meter_readings && (
                        <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                          <p>
                            Chỉ số cũ:{" "}
                            {formatNumber(item.meter_readings.old_value)}
                          </p>

                          <p>
                            Chỉ số mới:{" "}
                            {formatNumber(item.meter_readings.new_value)}
                          </p>

                          <p>
                            Tiêu thụ:{" "}
                            {item.meter_readings.consumption === null
                              ? "—"
                              : formatNumber(
                                  item.meter_readings.consumption
                                )}
                          </p>
                        </div>
                      )}

                      {item.services && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Đơn vị: {item.services.unit}
                        </p>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      {formatNumber(item.quantity)}
                    </td>

                    <td className="p-3 text-right">
                      {formatMoney(item.unit_price)}
                    </td>

                    <td className="p-3 text-right font-semibold">
                      {formatMoney(item.subtotal)}
                    </td>
                  </tr>
                ))}

                {invoice.invoice_items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Hóa đơn chưa có khoản phí nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================================================
            TOTAL
        ================================================ */}

        <div className="flex justify-end border-t pt-5">
          <div className="w-full space-y-3 sm:max-w-sm">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">
                Tổng tiền hóa đơn
              </span>

              <span className="font-semibold">
                {formatMoney(invoice.total_amount)}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">
                Đã thanh toán
              </span>

              <span className="font-semibold text-green-600">
                {formatMoney(invoice.paid_amount)}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-t pt-3">
              <span className="font-semibold">
                Còn phải thanh toán
              </span>

              <span className="text-xl font-bold text-red-600">
                {formatMoney(remainingAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* ================================================
            NOTE
        ================================================ */}

        {invoice.note && (
          <div className="rounded-lg bg-muted/40 p-4">
            <p className="text-sm font-semibold">Ghi chú</p>

            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
              {invoice.note}
            </p>
          </div>
        )}

        <div className="hidden border-t pt-5 text-center text-xs text-muted-foreground print:block">
          Hóa đơn được trích xuất từ hệ thống quản lý phòng trọ.
        </div>
      </div>

      {/* ================================================
          PAYMENT HISTORY
      ================================================ */}

      <section className="space-y-5 rounded-xl border bg-white p-5 shadow-sm print:hidden">
        {/* Header */}

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Wallet className="size-5 text-blue-600" />
              Lịch sử thanh toán
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Các giao dịch thanh toán của hóa đơn này.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPayments}
            disabled={paymentLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              className={`size-4 ${paymentLoading ? "animate-spin" : ""}`}
            />
            Làm mới
          </button>
        </div>

        {/* Summary */}

        {paymentData && (
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Giao dịch thành công"
              value={String(
                paymentData.summary.successful_payment_count
              )}
              icon={<CheckCircle2 className="size-5" />}
            />

            <SummaryCard
              label="Tổng tiền đã thanh toán"
              value={formatMoney(
                paymentData.summary.successful_payment_amount
              )}
              icon={<Wallet className="size-5" />}
              variant="green"
            />

            <SummaryCard
              label="Còn phải thanh toán"
              value={formatMoney(
                paymentData.invoice.remaining_amount
              )}
              icon={<CreditCard className="size-5" />}
              variant="orange"
            />
          </div>
        )}

        {/* Filters */}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="payment-status"
              className="mb-1.5 block text-sm font-medium"
            >
              Trạng thái giao dịch
            </label>

            <select
              id="payment-status"
              value={paymentStatus}
              onChange={(event) => {
                setPaymentStatus(event.target.value);
                setPaymentPage(1);
              }}
              className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-blue-500"
            >
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="payment-method"
              className="mb-1.5 block text-sm font-medium"
            >
              Phương thức thanh toán
            </label>

            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) => {
                setPaymentMethod(event.target.value);
                setPaymentPage(1);
              }}
              className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-blue-500"
            >
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}

        {paymentError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="size-5 shrink-0" />
            <span className="flex-1">{paymentError}</span>

            <button
              type="button"
              onClick={fetchPayments}
              className="font-semibold underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Loading */}

        {paymentLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Đang tải lịch sử thanh toán...
          </div>
        )}

        {/* Empty */}

        {!paymentLoading &&
          !paymentError &&
          paymentData?.payments.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <CreditCard className="mb-3 size-10 text-gray-300" />

              <p className="font-medium">
                Chưa có giao dịch thanh toán
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Các khoản thanh toán sẽ hiển thị tại đây.
              </p>
            </div>
          )}

        {/* Payment table */}

        {!paymentLoading &&
          !paymentError &&
          paymentData &&
          paymentData.payments.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">
                        Người thanh toán
                      </th>

                      <th className="px-4 py-3 text-right font-medium">
                        Số tiền
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Phương thức
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Thời gian
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Người ghi nhận
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {paymentData.payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-muted/30"
                      >
                        {/* Payer */}

                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {payment.payer?.full_name ??
                              "Không xác định"}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {payment.payer?.phone ?? "—"}
                          </p>
                        </td>

                        {/* Amount */}

                        <td className="px-4 py-3 text-right font-semibold">
                          {formatMoney(payment.amount)}
                        </td>

                        {/* Method */}

                        <td className="px-4 py-3">
                          {PAYMENT_METHOD_LABELS[
                            payment.payment_method
                          ]}
                        </td>

                        {/* Date */}

                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateTime(payment.payment_date)}
                        </td>

                        {/* Created by */}

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="size-4 shrink-0 text-muted-foreground" />

                            <span>
                              {payment.created_by?.full_name ??
                                payment.created_by?.email ??
                                "Hệ thống"}
                            </span>
                          </div>
                        </td>

                        {/* Status */}

                        <td className="px-4 py-3">
                          <PaymentStatusBadge
                            status={payment.status}
                          />
                        </td>


                        <td className="px-4 py-3 text-center">
                          {payment.payment_method === "BANK_TRANSFER" &&
                          payment.status === "PENDING" ? (
                            <div className="flex justify-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                className="bg-green-600 text-white hover:bg-green-700"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setBankActionError("");
                                  setConfirmBankDialogOpen(true);
                                }}
                              >
                                <CheckCircle2 className="mr-1 size-4" />
                                Xác nhận
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setRejectReason("");
                                  setBankActionError("");
                                  setRejectBankDialogOpen(true);
                                }}
                              >
                                <Ban className="mr-1 size-4" />
                                Từ chối
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payment detail information */}

              <div className="space-y-2">
                {paymentData.payments.map((payment) => (
                  (
                      payment.transaction_ref ||
                      payment.payos_order_code ||
                      payment.proof_image_url ||
                      payment.rejection_reason ||
                      payment.note
                    ) && (
                    <details
                      key={`detail-${payment.id}`}
                      className="rounded-lg border px-4 py-3"
                    >
                      <summary className="cursor-pointer text-sm font-medium">
                        Chi tiết giao dịch #{payment.id}
                      </summary>

                      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                        {payment.transaction_ref && (
                          <InfoRow
                            label="Mã giao dịch"
                            value={payment.transaction_ref}
                          />
                        )}

                        {payment.payos_order_code && (
                          <InfoRow
                            label="Mã đơn PayOS"
                            value={payment.payos_order_code}
                          />
                        )}

                        {payment.note && (
                          <div className="sm:col-span-2">
                            <p className="text-muted-foreground">
                              Ghi chú
                            </p>

                            <p className="mt-1 whitespace-pre-wrap">
                              {payment.note}
                            </p>
                          </div>
                        )}

                        {payment.proof_image_url && (
                            <div className="sm:col-span-2 space-y-2">
                              <p className="text-muted-foreground">Ảnh minh chứng chuyển khoản</p>

                              <a
                                href={payment.proof_image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block"
                              >
                                <img
                                  src={payment.proof_image_url}
                                  alt="Ảnh minh chứng chuyển khoản"
                                  className="max-h-72 max-w-full rounded-lg border object-contain"
                                />
                                <span className="mt-1 block text-xs text-blue-600 hover:underline">
                                  Mở ảnh kích thước đầy đủ
                                </span>
                              </a>
                            </div>
                          )}

                          {payment.rejection_reason && (
                            <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3">
                              <p className="font-medium text-red-700">Lý do từ chối</p>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-red-600">
                                {payment.rejection_reason}
                              </p>
                            </div>
                          )}
                      </div>
                    </details>
                  )
                ))}
              </div>

              {/* Pagination */}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Tổng {paymentData.pagination.totalItems} giao dịch
                  {" · "}
                  Trang {paymentData.pagination.page}/
                  {Math.max(paymentData.pagination.totalPages, 1)}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      !paymentData.pagination.hasPreviousPage ||
                      paymentLoading
                    }
                    onClick={() =>
                      setPaymentPage((previous) =>
                        Math.max(1, previous - 1)
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                    Trước
                  </button>

                  <button
                    type="button"
                    disabled={
                      !paymentData.pagination.hasNextPage ||
                      paymentLoading
                    }
                    onClick={() =>
                      setPaymentPage((previous) => previous + 1)
                    }
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sau
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </>
          )}
      </section>

      {/* PRINT FOOTER */}

      <div className="hidden print:block print:pt-8">
        <div className="grid grid-cols-2 gap-8 text-center text-sm">
          <div>
            <p className="font-semibold">Người thuê</p>
            <p className="mt-1 text-xs text-gray-500">
              (Ký và ghi rõ họ tên)
            </p>
          </div>

          <div>
            <p className="font-semibold">Chủ nhà</p>
            <p className="mt-1 text-xs text-gray-500">
              (Ký và ghi rõ họ tên)
            </p>
          </div>
        </div>
      </div>

      {/* PRINT CSS */}

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          #invoice-print-area,
          #invoice-print-area * {
            visibility: visible;
          }

          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          #invoice-print-area table {
            width: 100%;
            border-collapse: collapse;
          }

          #invoice-print-area tr {
            break-inside: avoid;
          }

          #invoice-print-area thead {
            display: table-header-group;
          }

          #invoice-print-area {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          button,
          a {
            display: none !important;
          }
        }
      `}</style>
      

        <Dialog
          open={cancelDialogOpen}
          onOpenChange={(open) => {
            // Không cho đóng dialog khi đang gửi yêu cầu hủy
            if (cancelling) return;

            setCancelDialogOpen(open);

            if (!open) {
              setCancelError("");
            }
          }}
        >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="flex size-9 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Ban className="size-5" />
              </span>
              Hủy hóa đơn
            </DialogTitle>
            <DialogDescription>
              Bạn đang thực hiện hủy hóa đơn{" "}
              <span className="font-semibold text-foreground">
                {invoice.invoice_number}
              </span>
              . Vui lòng kiểm tra thông tin trước khi xác nhận.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>
              Sau khi hủy, hóa đơn sẽ chuyển sang trạng thái
              <strong> Đã hủy</strong>. Thao tác này không thể hoàn tác bằng
              chức năng hiện tại.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancel-reason">
              Lý do hủy <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) => {
                setCancelReason(event.target.value);
                setCancelError("");
              }}
              placeholder="Ví dụ: Hóa đơn tính sai tiền điện..."
              rows={4}
              maxLength={1000}
              disabled={cancelling}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Vui lòng nhập lý do cụ thể.</span>
              <span>{cancelReason.length}/1000</span>
            </div>
          </div>

          {cancelError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{cancelError}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={cancelling}
              onClick={() => setCancelDialogOpen(false)}
            >
              Đóng
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelling || !cancelReason.trim()}
              onClick={handleCancelInvoice}
            >
              {cancelling ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang hủy...
                </>
              ) : (
                <>
                  <Ban className="size-4" />
                  Xác nhận hủy
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      
        <Dialog
          open={cashDialogOpen}
          onOpenChange={(open) => {
            if (cashLoading) return;

            setCashDialogOpen(open);

            if (!open) {
              setCashError("");
            }
          }}
        >
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <span className="flex size-9 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Wallet className="size-5" />
                </span>
                Ghi nhận thanh toán tiền mặt
              </DialogTitle>

              <DialogDescription>
                Ghi nhận khoản tiền chủ trọ đã thực tế nhận từ người thuê.
              </DialogDescription>
            </DialogHeader>

            {/* Invoice summary */}
            <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Mã hóa đơn</span>
                <span className="font-medium">
                  {invoice.invoice_number}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Tổng hóa đơn</span>
                <span className="font-medium">
                  {formatMoney(invoice.total_amount)}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Đã thanh toán</span>
                <span className="font-medium text-green-600">
                  {formatMoney(invoice.paid_amount)}
                </span>
              </div>

              <div className="flex justify-between gap-3 border-t pt-2">
                <span className="font-semibold">Còn phải thanh toán</span>
                <span className="font-bold text-red-600">
                  {formatMoney(remainingAmount)}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="cash-amount">
                Số tiền nhận được <span className="text-red-500">*</span>
              </Label>

              <input
                id="cash-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={cashAmount}
                onChange={(event) => {
                  setCashAmount(event.target.value);
                  setCashError("");
                }}
                placeholder="Nhập số tiền"
                disabled={cashLoading}
                className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
              />

              {cashAmount && Number(cashAmount) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Số tiền: {formatMoney(cashAmount)}
                </p>
              )}

              <button
                type="button"
                disabled={cashLoading || remainingAmount <= 0}
                onClick={() => {
                  setCashAmount(String(remainingAmount));
                  setCashError("");
                }}
                className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
              >
                Thanh toán toàn bộ số tiền còn lại
              </button>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="cash-note">Ghi chú</Label>

              <Textarea
                id="cash-note"
                value={cashNote}
                onChange={(event) => setCashNote(event.target.value)}
                placeholder="Ví dụ: Thu tiền phòng tháng 11..."
                rows={3}
                maxLength={1000}
                disabled={cashLoading}
                className="resize-none"
              />

              <p className="text-right text-xs text-muted-foreground">
                {cashNote.length}/1000
              </p>
            </div>

            {/* Error */}
            {cashError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{cashError}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={cashLoading}
                onClick={() => setCashDialogOpen(false)}
              >
                Đóng
              </Button>

              <Button
                type="button"
                disabled={
                  cashLoading ||
                  !cashAmount.trim() ||
                  Number(cashAmount) <= 0
                }
                onClick={handleCashPayment}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {cashLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Xác nhận đã nhận tiền
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      <Dialog
  open={confirmBankDialogOpen}
  onOpenChange={(open) => {
    if (bankActionLoading) return;

    setConfirmBankDialogOpen(open);

    if (!open) {
      setBankActionError("");
    }
  }}
>
  <DialogContent className="sm:max-w-[460px]">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <CheckCircle2 className="size-5 text-green-600" />
        Xác nhận chuyển khoản
      </DialogTitle>

      <DialogDescription>
        Xác nhận bạn đã kiểm tra và thực tế nhận được khoản tiền này.
      </DialogDescription>
    </DialogHeader>

    {/* {selectedPayment && (
      <div className="space-y-3 rounded-lg bg-muted/40 p-4 text-sm">
        <InfoRow
          label="Mã giao dịch"
          value={selectedPayment.transaction_ref || "—"}
        />
        <InfoRow
          label="Người thanh toán"
          value={selectedPayment.payer?.full_name || "Không xác định"}
        />
        <InfoRow
          label="Số tiền"
          value={formatMoney(selectedPayment.amount)}
        />
        <InfoRow
          label="Ngày thanh toán"
          value={formatDateTime(selectedPayment.payment_date)}
        />
      </div>
    )} */}

          {selectedPayment && (
  <div className="space-y-3 rounded-lg bg-muted/40 p-4 text-sm">
    <InfoRow
      label="Mã giao dịch"
      value={selectedPayment.transaction_ref || "—"}
    />

    <InfoRow
      label="Người thanh toán"
      value={selectedPayment.payer?.full_name || "Không xác định"}
    />

    <InfoRow
      label="Số điện thoại"
      value={selectedPayment.payer?.phone || "—"}
    />

    <InfoRow
      label="Số tiền"
      value={formatMoney(selectedPayment.amount)}
    />

    <InfoRow
      label="Ngày thanh toán"
      value={formatDateTime(selectedPayment.payment_date)}
    />

    {/* Ảnh minh chứng */}
<div className="border-t pt-3">
  <p className="mb-2 font-medium">Ảnh minh chứng chuyển khoản</p>

  {selectedPayment.proof_image_url ? (
    <a
      href={selectedPayment.proof_image_url}
      target="_blank"
      rel="noopener noreferrer"
      className="mx-auto block w-full max-w-[320px]"
    >
      <img
        src={selectedPayment.proof_image_url}
        alt="Ảnh minh chứng chuyển khoản"
        className="h-[180px] w-full rounded-lg border bg-white object-contain"
      />

      <span className="mt-2 block text-center text-xs text-blue-600 hover:underline">
        Nhấn để xem ảnh kích thước đầy đủ
      </span>
    </a>
  ) : (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      Không có ảnh minh chứng.
    </div>
  )}
</div>
  </div>
)}

    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      Sau khi xác nhận, giao dịch chuyển sang thành công và số tiền sẽ được
      cộng vào hóa đơn.
    </div>

    {bankActionError && confirmBankDialogOpen && (
      <div
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600"
      >
        {bankActionError}
      </div>
    )}

    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        disabled={bankActionLoading}
        onClick={() => setConfirmBankDialogOpen(false)}
      >
        Hủy
      </Button>

      <Button
        type="button"
        disabled={bankActionLoading || !selectedPayment}
        onClick={handleConfirmBankTransfer}
        className="bg-green-600 text-white hover:bg-green-700"
      >
        {bankActionLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Đang xác nhận...
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4" />
            Xác nhận thanh toán
          </>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
      </Dialog>
      

      <Dialog
  open={rejectBankDialogOpen}
  onOpenChange={(open) => {
    if (bankActionLoading) return;

    setRejectBankDialogOpen(open);

    if (!open) {
      setBankActionError("");
    }
  }}
>
  <DialogContent className="sm:max-w-[460px]">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Ban className="size-5 text-red-600" />
        Từ chối giao dịch
      </DialogTitle>

      <DialogDescription>
        Vui lòng kiểm tra giao dịch và nhập lý do từ chối.
      </DialogDescription>
    </DialogHeader>

    {selectedPayment && (
      <div className="space-y-2 rounded-lg bg-muted/40 p-4 text-sm">
        <InfoRow
          label="Người thanh toán"
          value={selectedPayment.payer?.full_name || "Không xác định"}
        />
        <InfoRow
          label="Số tiền"
          value={formatMoney(selectedPayment.amount)}
        />
        <InfoRow
          label="Mã giao dịch"
          value={selectedPayment.transaction_ref || "—"}
        />
      </div>
    )}

    <div className="space-y-2">
      <Label htmlFor="bank-reject-reason">
        Lý do từ chối <span className="text-red-500">*</span>
      </Label>

      <Textarea
        id="bank-reject-reason"
        value={rejectReason}
        onChange={(event) => {
          setRejectReason(event.target.value);
          setBankActionError("");
        }}
        placeholder="Ví dụ: Không tìm thấy giao dịch trong tài khoản ngân hàng..."
        rows={4}
        maxLength={1000}
        disabled={bankActionLoading}
        className="resize-none"
      />

      <p className="text-right text-xs text-muted-foreground">
        {rejectReason.length}/1000
      </p>
    </div>

    {bankActionError && rejectBankDialogOpen && (
      <div
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600"
      >
        {bankActionError}
      </div>
    )}

    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        disabled={bankActionLoading}
        onClick={() => setRejectBankDialogOpen(false)}
      >
        Hủy
      </Button>

      <Button
        type="button"
        variant="destructive"
        disabled={bankActionLoading || !rejectReason.trim()}
        onClick={handleRejectBankTransfer}
      >
        {bankActionLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          <>
            <Ban className="size-4" />
            Xác nhận từ chối
          </>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    </div>
  );
}

// ======================================================
// REUSABLE COMPONENTS
// ======================================================

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  variant = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant?: "default" | "green" | "orange";
}) {
  const styles = {
    default: "bg-gray-50 text-gray-900",
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700",
  };

  return (
    <div className={`rounded-lg p-4 ${styles[variant]}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm opacity-80">{label}</p>
        {icon}
      </div>

      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
