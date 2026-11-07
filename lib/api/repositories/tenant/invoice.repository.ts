import { prisma } from "@/lib/prisma";

export type TenantInvoiceFilter = {
  profileId: bigint;
  page: number;
  limit: number;
  billingMonth?: number;
  billingYear?: number;
  status?: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
};

export const tenantInvoiceRepository = {
  // Lấy hồ sơ người thuê theo user đăng nhập
  findProfileByUserId: async (userId: bigint) => {
    return prisma.profiles.findUnique({
      where: {
        user_id: userId,
      },
      select: {
        id: true,
      },
    });
  },

  // Đếm tổng hóa đơn theo điều kiện lọc
  count: async (filter: TenantInvoiceFilter) => {
    const {
      profileId,
      billingMonth,
      billingYear,
      status,
    } = filter;

    return prisma.invoices.count({
      where: {
        rental_contracts: {
          is: {
            contract_tenants: {
              some: {
                profile_id: profileId,
              },
            },
          },
        },

        ...(billingMonth !== undefined && {
          billing_month: billingMonth,
        }),

        ...(billingYear !== undefined && {
          billing_year: billingYear,
        }),

        ...(status && {
          status,
        }),
      },
    });
  },

  // Lấy danh sách hóa đơn
  findMany: async (filter: TenantInvoiceFilter) => {
    const {
      profileId,
      page,
      limit,
      billingMonth,
      billingYear,
      status,
    } = filter;

    return prisma.invoices.findMany({
      where: {
        // Chỉ lấy hóa đơn thuộc hợp đồng người thuê đã tham gia
        rental_contracts: {
          is: {
            contract_tenants: {
              some: {
                profile_id: profileId,
              },
            },
          },
        },

        ...(billingMonth !== undefined && {
          billing_month: billingMonth,
        }),

        ...(billingYear !== undefined && {
          billing_year: billingYear,
        }),

        ...(status && {
          status,
        }),
      },

      skip: (page - 1) * limit,
      take: limit,

      orderBy: [
        { billing_year: "desc" },
        { billing_month: "desc" },
        { issue_date: "desc" },
      ],

      select: {
        id: true,
        invoice_number: true,
        billing_month: true,
        billing_year: true,
        issue_date: true,
        due_date: true,
        total_amount: true,
        paid_amount: true,
        status: true,
        pdf_url: true,
        note: true,
        cancelled_at: true,
        cancellation_reason: true,

        rental_contracts: {
          select: {
            id: true,
            contract_number: true,

            rooms: {
              select: {
                room_number: true,
              },
            },
          },
        },

        invoice_items: {
          orderBy: {
            id: "asc",
          },

          select: {
            id: true,
            description: true,
            quantity: true,
            unit_price: true,
            subtotal: true,

            services: {
              select: {
                name: true,
                unit: true,
                type: true,
              },
            },

            meter_readings: {
              select: {
                id: true,
                meter_type: true,
                reading_date: true,
                old_value: true,
                new_value: true,
                consumption: true,
                period_month: true,
                period_year: true,
                image_url: true,
              },
            },
          },
        },
        payments: {
          where: {
            status: "PENDING",
          },
          orderBy: {
            id: "desc",
          },
          select: {
            id: true,
            amount: true,
            status: true,
            transaction_ref: true,
            payment_date: true,
            proof_image_url: true,
          },
        },
      },
    });
  },
};