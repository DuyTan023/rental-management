import { prisma } from "@/lib/prisma";

type CancelInvoiceInput = {
  invoiceId: bigint;
  reason: string;
};

export const invoiceCancelRepository = {
  async cancel(input: CancelInvoiceInput) {
    const { invoiceId, reason } = input;

    return prisma.$transaction(
      async (tx) => {
        // 1. Lấy hóa đơn
        const invoice = await tx.invoices.findUnique({
          where: {
            id: invoiceId,
          },
          select: {
            id: true,
            invoice_number: true,
            total_amount: true,
            paid_amount: true,
            status: true,
          },
        });

        if (!invoice) {
          throw new Error("INVOICE_NOT_FOUND");
        }

        // 2. Kiểm tra trạng thái
        if (invoice.status === "CANCELLED") {
          throw new Error("INVOICE_ALREADY_CANCELLED");
        }

        // 3. Kiểm tra số tiền đã thanh toán
        if (Number(invoice.paid_amount) > 0) {
          throw new Error("INVOICE_HAS_PAYMENT");
        }

        // 4. Kiểm tra giao dịch thành công
        const successfulPayments = await tx.payments.count({
          where: {
            invoice_id: invoiceId,
            status: "SUCCESS",
          },
        });

        if (successfulPayments > 0) {
          throw new Error("INVOICE_HAS_PAYMENT");
        }

        // 5. Cập nhật hóa đơn
        const cancelledInvoice = await tx.invoices.update({
          where: {
            id: invoiceId,
          },
          data: {
            status: "CANCELLED",
            cancelled_at: new Date(),
            cancellation_reason: reason,
          },
          select: {
            id: true,
            invoice_number: true,
            status: true,
            cancelled_at: true,
            cancellation_reason: true,
            updated_at: true,
          },
        });

        return cancelledInvoice;
      },
      {
        isolationLevel: "Serializable",
      }
    );
  },
};