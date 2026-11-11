
import { prisma } from "@/lib/prisma";

export const dashboardRepository = {
  // ==========================================
  // ROOM STATISTICS
  // ==========================================

  async getRoomStatusCounts() {
    return prisma.rooms.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    });
  },

  // ==========================================
  // ACTIVE TENANTS
  // Đếm profile duy nhất, tránh trùng người thuê
  // ==========================================

  async getActiveTenantCount() {
    const tenants = await prisma.contract_tenants.findMany({
      where: {
        status: "ACTIVE",
        rental_contracts: {
          status: "ACTIVE",
        },
      },
      select: {
        profile_id: true,
      },
      distinct: ["profile_id"],
    });

    return tenants.length;
  },

  // ==========================================
  // EXPIRING CONTRACTS
  // ==========================================

  async getExpiringContractCount(from: Date, to: Date) {
    return prisma.rental_contracts.count({
      where: {
        status: "ACTIVE",
        end_date: {
          gte: from,
          lt: to,
        },
      },
    });
  },

  // ==========================================
  // SUCCESSFUL PAYMENTS
  // ==========================================

  async getSuccessfulPayments(from: Date, to: Date) {
    return prisma.payments.findMany({
      where: {
        status: "SUCCESS",
        payment_date: {
          gte: from,
          lt: to,
        },
      },
      select: {
        amount: true,
        payment_date: true,
      },
      orderBy: {
        payment_date: "asc",
      },
    });
  },

  // ==========================================
  // RECENT PAYMENTS
  // ==========================================

  async getRecentPayments() {
    return prisma.payments.findMany({
      where: {
        status: "SUCCESS",
      },
      take: 5,
      orderBy: {
        payment_date: "desc",
      },
      select: {
        id: true,
        amount: true,
        payment_date: true,
        profiles: {
          select: {
            full_name: true,
          },
        },
        invoices: {
          select: {
            rental_contracts: {
              select: {
                rooms: {
                  select: {
                    room_number: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  // ==========================================
  // RECENT CONTRACTS
  // ==========================================

  async getRecentContracts() {
    return prisma.rental_contracts.findMany({
      take: 5,
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        contract_number: true,
        created_at: true,
        rooms: {
          select: {
            room_number: true,
          },
        },
      },
    });
  },

  // ==========================================
  // RECENT METER READINGS
  // ==========================================

  async getRecentMeterReadings() {
    return prisma.meter_readings.findMany({
      take: 5,
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        created_at: true,
        status: true,
        rooms: {
          select: {
            room_number: true,
          },
        },
        services: {
          select: {
            name: true,
          },
        },
        users: {
          select: {
            profiles: {
              select: {
                full_name: true,
              },
            },
          },
        },
      },
    });
  },

  // ==========================================
  // RECENT ASSET INCIDENTS
  // ==========================================

  async getRecentIncidents() {
    return prisma.asset_incidents.findMany({
      take: 5,
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        title: true,
        status: true,
        created_at: true,
        rooms: {
          select: {
            room_number: true,
          },
        },
      },
    });
  },

  // ==========================================
  // UNPAID INVOICES
  // ==========================================

  async getUnpaidInvoices() {
    return prisma.invoices.findMany({
      where: {
        status: {
          in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"],
        },
      },
      take: 5,
      orderBy: {
        due_date: "asc",
      },
      select: {
        id: true,
        invoice_number: true,
        total_amount: true,
        paid_amount: true,
        due_date: true,
        status: true,
        rental_contracts: {
          select: {
            rooms: {
              select: {
                room_number: true,
              },
            },
          },
        },
      },
    });
  },

  async countUnpaidInvoices() {
    return prisma.invoices.count({
      where: {
        status: {
          in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"],
        },
      },
    });
  },

  // ==========================================
  // PENDING INCIDENTS
  // ==========================================

  async getPendingIncidents() {
    return prisma.asset_incidents.findMany({
      where: {
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
      take: 5,
      orderBy: [
        {
          priority: "desc",
        },
        {
          created_at: "desc",
        },
      ],
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        created_at: true,
        rooms: {
          select: {
            room_number: true,
          },
        },
      },
    });
  },

  async countPendingIncidents() {
    return prisma.asset_incidents.count({
      where: {
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
    });
  },

  // ==========================================
  // ASSET STATISTICS
  // ==========================================

  async countActiveAssets() {
    return prisma.room_assets.count({
      where: {
        is_active: true,
      },
    });
  },
};
