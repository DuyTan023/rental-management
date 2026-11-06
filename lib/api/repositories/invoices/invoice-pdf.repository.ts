// lib/repositories/landlord/invoice-pdf.repository.ts

import { prisma } from "@/lib/prisma";

export const invoicePdfRepository = {
  async findById(id: bigint) {
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
              orderBy: {
                role: "asc",
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