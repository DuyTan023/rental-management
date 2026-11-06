// repositories/landlord/invoice.repository.ts

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const invoiceRepository = {
  // Lấy dữ liệu hợp đồng và các thông tin cần thiết để lập hóa đơn
  findContractForInvoice(
    contractId: bigint,
    billingMonth: number,
    billingYear: number,
    periodStart: Date,
    periodEnd: Date,
  ) {
    return prisma.rental_contracts.findUnique({
      where: {
        id: contractId,
      },
      include: {
        // Thông tin phòng và các dịch vụ được áp dụng trong kỳ
        rooms: {
          include: {
            room_services: {
              where: {
                effective_from: {
                  lte: periodEnd,
                },
                OR: [
                  {
                    effective_to: null,
                  },
                  {
                    effective_to: {
                      gte: periodStart,
                    },
                  },
                ],
              },
              include: {
                services: true,
              },
            },
          },
        },

        // Danh sách người thuê trong hợp đồng
        contract_tenants: {
          include: {
            profiles: true,
          },
        },

        // Lấy lần điều chỉnh giá thuê gần nhất tính đến cuối kỳ
        contract_price_adjustments: {
          where: {
            effective_date: {
              lte: periodEnd,
            },
          },
          orderBy: [
            {
              effective_date: "desc",
            },
            {
              id: "desc",
            },
          ],
          take: 1,
        },

        // Các chỉ số điện nước đã được duyệt trong kỳ
        meter_readings: {
          where: {
            period_month: billingMonth,
            period_year: billingYear,
            status: "APPROVED",
          },
          include: {
            services: true,
          },
        },
      },
    });
  },

  // Kiểm tra hóa đơn đã tồn tại trong kỳ hay chưa
  findByContractPeriod(
    contractId: bigint,
    billingMonth: number,
    billingYear: number,
  ) {
    return prisma.invoices.findFirst({
      where: {
        contract_id: contractId,
        billing_month: billingMonth,
        billing_year: billingYear,
        status: {
          not: "CANCELLED",
        },
      },
    });
  },

  // Tạo hóa đơn cùng toàn bộ chi tiết hóa đơn
  createWithItems(data: Prisma.invoicesCreateInput) {
    return prisma.invoices.create({
      data,
      include: {
        invoice_items: true,
      },
    });
  },

  //Lấy danh sách hóa đơn
  findMany(
    where: Prisma.invoicesWhereInput,
    page: number,
    limit: number
  ) {
    return prisma.$transaction([
      prisma.invoices.findMany({
        where,
        include: {
          rental_contracts: {
            include: {
              rooms: true,
              contract_tenants: {
                where: {
                  role: "REPRESENTATIVE",
                },
                include: {
                  profiles: true,
                },
              },
            },
          },
        },
        orderBy: [
          {
            issue_date: "desc",
          },
          {
            id: "desc",
          },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.invoices.count({
        where,
      }),
    ]);
  },

  findById(id: bigint) {
    return prisma.invoices.findUnique({
      where: {
        id,
      },
      include: {
        rental_contracts: {
          include: {
            rooms: true,
            contract_tenants: {
              include: {
                profiles: true,
              },
            },
          },
        },

        invoice_items: {
          include: {
            services: true,
            meter_readings: true,
          },
          orderBy: {
            id: "asc",
          },
        },
      },
    });
  },
};
