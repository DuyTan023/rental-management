import { tenantPaymentHistoryRepository } from "@/lib/api/repositories/tenant/tenant-payment-history.repository";

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

function parsePositiveInteger(
  value: string | null,
  defaultValue: number,
  maxValue?: number
) {
  if (value === null) return defaultValue;

  const parsed = Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed <= 0 ||
    (maxValue !== undefined && parsed > maxValue)
  ) {
    throw new Error("Tham số phân trang không hợp lệ.");
  }

  return parsed;
}

function parseEnum<T extends readonly string[]>(
  value: string | null,
  allowedValues: T,
  fieldName: string
): T[number] | undefined {
  if (!value) return undefined;

  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} không hợp lệ.`);
  }

  return value as T[number];
}

export const tenantPaymentHistoryService = {
  async getHistory(
    userId: bigint,
    searchParams: URLSearchParams
  ) {
    const page = parsePositiveInteger(
      searchParams.get("page"),
      1
    );

    const limit = parsePositiveInteger(
      searchParams.get("limit"),
      10,
      100
    );

    const status = parseEnum(
      searchParams.get("status"),
      PAYMENT_STATUSES,
      "Trạng thái thanh toán"
    ) as PaymentStatus | undefined;

    const paymentMethod = parseEnum(
      searchParams.get("payment_method"),
      PAYMENT_METHODS,
      "Phương thức thanh toán"
    ) as PaymentMethod | undefined;

    // Tìm profile của tài khoản đăng nhập.
    const profile =
      await tenantPaymentHistoryRepository.findProfileByUserId(
        userId
      );

    if (!profile) {
      throw new Error("Tài khoản chưa có hồ sơ người thuê.");
    }

    const profileId = profile.id;
    const skip = (page - 1) * limit;

    const filters = {
      profileId,
      status,
      paymentMethod,
      skip,
      take: limit,
    };

    const [
      payments,
      total,
      totalPaid,
      totalPending,
      totalTransactions,
    ] = await Promise.all([
      tenantPaymentHistoryRepository.findMany(filters),
      tenantPaymentHistoryRepository.count(filters),
      tenantPaymentHistoryRepository.getTotalPaid(profileId),
      tenantPaymentHistoryRepository.getTotalPending(profileId),
      tenantPaymentHistoryRepository.countAll(profileId),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      payments: payments.map((payment) => ({
        id: payment.id.toString(),
        invoice_id: payment.invoice_id.toString(),

        amount: payment.amount.toString(),

        payment_method: payment.payment_method,
        status: payment.status,

        transaction_ref: payment.transaction_ref,
        payos_order_code: payment.payos_order_code,

        payment_date: payment.payment_date?.toISOString() ?? null,

        proof_image_url: payment.proof_image_url,
        rejection_reason: payment.rejection_reason,
        note: payment.note,

        created_at: payment.created_at.toISOString(),
        updated_at: payment.updated_at.toISOString(),

        invoice: {
          id: payment.invoices.id.toString(),
          invoice_number: payment.invoices.invoice_number,
          billing_month: payment.invoices.billing_month,
          billing_year: payment.invoices.billing_year,
        },
      })),

      summary: {
        total_paid: totalPaid.toString(),
        total_pending: totalPending.toString(),
        total_transactions: totalTransactions,
      },

      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_previous_page: page > 1,
      },
    };
  },
};