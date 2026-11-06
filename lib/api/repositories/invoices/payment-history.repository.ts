import { prisma } from "@/lib/prisma";

type PaymentFilters = {
  invoiceId: bigint;
  skip: number;
  take: number;
  status?: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";
  paymentMethod?: "CASH" | "BANK_TRANSFER" | "PAYOS";
};

export const paymentHistoryRepository = {
  // Kiểm tra hóa đơn có tồn tại không
  async findInvoice(invoiceId: bigint) {
    return prisma.invoices.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        invoice_number: true,
        total_amount: true,
        paid_amount: true,
        status: true,
      },
    });
  },

  // Lấy danh sách giao dịch
  async findMany(filters: PaymentFilters) {
    const {
      invoiceId,
      skip,
      take,
      status,
      paymentMethod,
    } = filters;

    return prisma.payments.findMany({
      where: {
        invoice_id: invoiceId,
        ...(status && { status }),
        ...(paymentMethod && {
          payment_method: paymentMethod,
        }),
      },
      include: {
        profiles: {
          select: {
            id: true,
            full_name: true,
            phone: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            profiles: {
              select: {
                full_name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { created_at: "desc" },
        { id: "desc" },
      ],
      skip,
      take,
    });
  },

  // Đếm số giao dịch theo bộ lọc
  async count(filters: PaymentFilters) {
    return prisma.payments.count({
      where: {
        invoice_id: filters.invoiceId,
        ...(filters.status && {
          status: filters.status,
        }),
        ...(filters.paymentMethod && {
          payment_method: filters.paymentMethod,
        }),
      },
    });
  },

  // Tổng tiền đã thanh toán thành công của hóa đơn
  async getSuccessfulAmount(invoiceId: bigint) {
    return prisma.payments.aggregate({
      where: {
        invoice_id: invoiceId,
        status: "SUCCESS",
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });
  },
};