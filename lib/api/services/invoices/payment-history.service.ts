import { paymentHistoryRepository } from "@/lib/api/repositories/invoices/payment-history.repository";

const PAYMENT_STATUSES = [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
] as const;

const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "PAYOS",
] as const;

type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

type PaymentHistoryInput = {
  invoiceId: bigint;
  page?: number;
  limit?: number;
  status?: string;
  paymentMethod?: string;
};

export const paymentHistoryService = {
  async getHistory(input: PaymentHistoryInput) {
    const {
      invoiceId,
      page = 1,
      limit = 10,
      status,
      paymentMethod,
    } = input;

    // 1. Kiểm tra hóa đơn
    const invoice =
      await paymentHistoryRepository.findInvoice(invoiceId);

    if (!invoice) {
      throw new Error("INVOICE_NOT_FOUND");
    }

    // 2. Kiểm tra bộ lọc
    if (
      status &&
      !PAYMENT_STATUSES.includes(status as PaymentStatus)
    ) {
      throw new Error("INVALID_PAYMENT_STATUS");
    }

    if (
      paymentMethod &&
      !PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)
    ) {
      throw new Error("INVALID_PAYMENT_METHOD");
    }

    // 3. Chuẩn hóa phân trang
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(
      100,
      Math.max(1, Math.floor(limit))
    );

    const skip = (safePage - 1) * safeLimit;

    const filters = {
      invoiceId,
      skip,
      take: safeLimit,
      status: status as PaymentStatus | undefined,
      paymentMethod: paymentMethod as PaymentMethod | undefined,
    };

    // 4. Truy vấn song song
    const [payments, totalItems, successfulSummary] =
      await Promise.all([
        paymentHistoryRepository.findMany(filters),
        paymentHistoryRepository.count(filters),
        paymentHistoryRepository.getSuccessfulAmount(invoiceId),
      ]);

    const totalPages = Math.ceil(totalItems / safeLimit);

    // 5. Chuẩn hóa dữ liệu
    return {
      invoice: {
        id: invoice.id.toString(),
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount.toString(),
        paid_amount: invoice.paid_amount.toString(),
        remaining_amount: (
          Number(invoice.total_amount) -
          Number(invoice.paid_amount)
        ).toString(),
        status: invoice.status,
      },

      summary: {
        successful_payment_count:
          successfulSummary._count.id,
        successful_payment_amount:
          successfulSummary._sum.amount?.toString() ?? "0",
      },

      payments: payments.map((payment) => ({
        id: payment.id.toString(),
        invoice_id: payment.invoice_id.toString(),

        payer: payment.profiles
          ? {
              id: payment.profiles.id.toString(),
              full_name: payment.profiles.full_name,
              phone: payment.profiles.phone,
            }
          : null,

        created_by: payment.users
          ? {
              id: payment.users.id.toString(),
              email: payment.users.email,
              full_name:
                payment.users.profiles?.full_name ?? null,
            }
          : null,

        amount: payment.amount.toString(),
        payment_method: payment.payment_method,
        status: payment.status,
        transaction_ref: payment.transaction_ref,
        payos_order_code: payment.payos_order_code,
        payment_date: payment.payment_date?.toISOString() ?? null,
        note: payment.note,
        created_at: payment.created_at.toISOString(),
        updated_at: payment.updated_at.toISOString(),
        proof_image_url: payment.proof_image_url,
        rejection_reason: payment.rejection_reason,
      })),

      pagination: {
        page: safePage,
        limit: safeLimit,
        totalItems,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPreviousPage: safePage > 1,
      },
    };
  },
};