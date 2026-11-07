import {
  tenantInvoiceRepository,
} from "@/lib/api/repositories/tenant/invoice.repository";

export type InvoiceStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

type GetTenantInvoicesInput = {
  userId: bigint;
  page?: number;
  limit?: number;
  billingMonth?: number;
  billingYear?: number;
  status?: string;
};

const INVOICE_STATUSES: InvoiceStatus[] = [
  "UNPAID",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
];

export const tenantInvoiceService = {
  getMany: async (input: GetTenantInvoicesInput) => {
    const {
      userId,
      page = 1,
      limit = 10,
      billingMonth,
      billingYear,
      status,
    } = input;

    // =========================================
    // VALIDATE
    // =========================================

    if (!Number.isInteger(page) || page < 1) {
      throw new Error("INVALID_PAGE");
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new Error("INVALID_LIMIT");
    }

    if (
      billingMonth !== undefined &&
      (!Number.isInteger(billingMonth) ||
        billingMonth < 1 ||
        billingMonth > 12)
    ) {
      throw new Error("INVALID_BILLING_MONTH");
    }

    if (
      billingYear !== undefined &&
      (!Number.isInteger(billingYear) || billingYear < 2000)
    ) {
      throw new Error("INVALID_BILLING_YEAR");
    }

    if (
      status &&
      !INVOICE_STATUSES.includes(status as InvoiceStatus)
    ) {
      throw new Error("INVALID_INVOICE_STATUS");
    }

    // =========================================
    // FIND TENANT PROFILE
    // =========================================

    const profile =
      await tenantInvoiceRepository.findProfileByUserId(userId);

    if (!profile) {
      throw new Error("PROFILE_NOT_FOUND");
    }

    // =========================================
    // QUERY INVOICES
    // =========================================

    const filter = {
      profileId: profile.id,
      page,
      limit,
      billingMonth,
      billingYear,
      status: status as InvoiceStatus | undefined,
    };

    const [invoices, totalItems] = await Promise.all([
      tenantInvoiceRepository.findMany(filter),
      tenantInvoiceRepository.count(filter),
    ]);

    // =========================================
    // PAGINATION
    // =========================================

    const totalPages = Math.ceil(totalItems / limit);

    return {
      invoices,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && page <= totalPages,
      },
    };
  },
};