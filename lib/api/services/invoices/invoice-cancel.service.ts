import { invoiceCancelRepository } from "@/lib/api/repositories/invoices/invoice-cancel.repository";

type CancelInvoiceInput = {
  invoiceId: bigint;
  reason: string;
};

export const invoiceCancelService = {
  async cancel(input: CancelInvoiceInput) {
    const reason = input.reason.trim();

    // 1. Kiểm tra lý do
    if (!reason) {
      throw new Error("CANCELLATION_REASON_REQUIRED");
    }

    if (reason.length > 1000) {
      throw new Error("CANCELLATION_REASON_TOO_LONG");
    }

    // 2. Thực hiện hủy hóa đơn
    const invoice = await invoiceCancelRepository.cancel({
      ...input,
      reason,
    });

    // 3. Chuẩn hóa dữ liệu trả về
    return {
      id: invoice.id.toString(),
      invoice_number: invoice.invoice_number,
      status: invoice.status,
      cancelled_at: invoice.cancelled_at?.toISOString() ?? null,
      cancellation_reason: invoice.cancellation_reason,
      updated_at: invoice.updated_at.toISOString(),
    };
  },
};