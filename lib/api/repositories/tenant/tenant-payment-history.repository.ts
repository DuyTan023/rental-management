import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

type PaymentMethod = "CASH" | "BANK_TRANSFER" | "PAYOS";

type PaymentFilters = {
  profileId: bigint;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  skip: number;
  take: number;
};

export const tenantPaymentHistoryRepository = {
  // Tìm profile theo tài khoản đăng nhập.
  findProfileByUserId(userId: bigint) {
    return prisma.profiles.findUnique({
      where: {
        user_id: userId,
      },
      select: {
        id: true,
      },
    });
  },

  // Điều kiện giới hạn giao dịch thuộc hợp đồng của người thuê.
  buildTenantPaymentWhere(
    profileId: bigint,
    filters?: {
      status?: PaymentStatus;
      paymentMethod?: PaymentMethod;
    }
  ): Prisma.paymentsWhereInput {
    return {
      invoices: {
        rental_contracts: {
        //   contract_tenants: {
        //     some: {
        //       profile_id: profileId,
        //       status: "ACTIVE",
        //     },
        //   },
        },
      },

      ...(filters?.status && {
        status: filters.status,
      }),

      ...(filters?.paymentMethod && {
        payment_method: filters.paymentMethod,
      }),
    };
  },

  // Lấy danh sách giao dịch.
  findMany(filters: PaymentFilters) {
    return prisma.payments.findMany({
      where: this.buildTenantPaymentWhere(filters.profileId, {
        status: filters.status,
        paymentMethod: filters.paymentMethod,
      }),

      include: {
        invoices: {
          select: {
            id: true,
            invoice_number: true,
            billing_month: true,
            billing_year: true,
          },
        },
      },

      orderBy: [
        {
          created_at: "desc",
        },
        {
          id: "desc",
        },
      ],

      skip: filters.skip,
      take: filters.take,
    });
  },

  // Đếm số giao dịch theo bộ lọc.
  count(filters: PaymentFilters) {
    return prisma.payments.count({
      where: this.buildTenantPaymentWhere(filters.profileId, {
        status: filters.status,
        paymentMethod: filters.paymentMethod,
      }),
    });
  },

  // Tổng tiền đã thanh toán thành công.
  async getTotalPaid(profileId: bigint) {
    const result = await prisma.payments.aggregate({
      where: this.buildTenantPaymentWhere(profileId, {
        status: "SUCCESS",
      }),
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount ?? new Prisma.Decimal(0);
  },

  // Tổng tiền đang chờ xác nhận.
  async getTotalPending(profileId: bigint) {
    const result = await prisma.payments.aggregate({
      where: this.buildTenantPaymentWhere(profileId, {
        status: "PENDING",
      }),
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount ?? new Prisma.Decimal(0);
  },

  // Tổng số giao dịch, không phụ thuộc bộ lọc.
  countAll(profileId: bigint) {
    return prisma.payments.count({
      where: this.buildTenantPaymentWhere(profileId),
    });
  },
};