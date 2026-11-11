
import { dashboardRepository } from "@/lib/api/repositories/dashboard/dashboard.repository";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + amount,
    1,
  );
}

function startOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

function toNumber(value: { toNumber(): number } | null | undefined) {
  return value?.toNumber() ?? 0;
}

function formatActivityDate(date: Date) {
  return date.toISOString();
}

export const dashboardService = {
  async getDashboard() {
    const now = new Date();

    const currentMonth = startOfMonth(now);
    const nextMonth = addMonths(currentMonth, 1);
    const previousMonth = addMonths(currentMonth, -1);

    // 12 tháng gần nhất, tính cả tháng hiện tại
    const chartStart = addMonths(currentMonth, -11);

    const today = startOfDay(now);
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 31);

    // ==========================================
    // FETCH DATA
    // ==========================================

    const [
      roomGroups,
      totalTenants,
      expiringContracts,
      successfulPayments,
      recentPayments,
      recentContracts,
      recentMeterReadings,
      recentIncidents,
      unpaidInvoices,
      unpaidInvoiceCount,
      pendingIncidents,
      pendingIncidentCount,
      totalAssets,
    ] = await Promise.all([
      dashboardRepository.getRoomStatusCounts(),

      dashboardRepository.getActiveTenantCount(),

      dashboardRepository.getExpiringContractCount(
        today,
        thirtyDaysLater,
      ),

      dashboardRepository.getSuccessfulPayments(
        chartStart,
        nextMonth,
      ),

      dashboardRepository.getRecentPayments(),

      dashboardRepository.getRecentContracts(),

      dashboardRepository.getRecentMeterReadings(),

      dashboardRepository.getRecentIncidents(),

      dashboardRepository.getUnpaidInvoices(),

      dashboardRepository.countUnpaidInvoices(),

      dashboardRepository.getPendingIncidents(),

      dashboardRepository.countPendingIncidents(),

      dashboardRepository.countActiveAssets(),
    ]);

    // ==========================================
    // ROOM STATUS
    // ==========================================

    const roomStatus = {
      occupied: 0,
      available: 0,
      maintenance: 0,
      inactive: 0,
    };

    for (const group of roomGroups) {
      const count = group._count._all;

      switch (group.status) {
        case "OCCUPIED":
          roomStatus.occupied = count;
          break;

        case "AVAILABLE":
          roomStatus.available = count;
          break;

        case "MAINTENANCE":
          roomStatus.maintenance = count;
          break;

        case "INACTIVE":
          roomStatus.inactive = count;
          break;
      }
    }

    const totalRooms = Object.values(roomStatus).reduce(
      (sum, value) => sum + value,
      0,
    );

    // ==========================================
    // REVENUE CHART
    // ==========================================

    const revenueByMonth = new Map<string, number>();

    for (let i = 0; i < 12; i++) {
      const date = addMonths(chartStart, i);

      const key = `${date.getFullYear()}-${date.getMonth()}`;

      revenueByMonth.set(key, 0);
    }

    for (const payment of successfulPayments) {
      if (!payment.payment_date) continue;

      const date = payment.payment_date;

      const key = `${date.getFullYear()}-${date.getMonth()}`;

      const current = revenueByMonth.get(key) ?? 0;

      revenueByMonth.set(
        key,
        current + toNumber(payment.amount),
      );
    }

    const revenueChart = Array.from(
      revenueByMonth.entries(),
    ).map(([key, revenue]) => {
      const [year, month] = key.split("-").map(Number);

      return {
        month: `T${month + 1}/${year}`,
        year,
        monthNumber: month + 1,
        revenue: Number(revenue.toFixed(2)),
      };
    });

    const currentKey =
      `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

    const previousKey =
      `${previousMonth.getFullYear()}-${previousMonth.getMonth()}`;

    const monthlyRevenue = revenueByMonth.get(currentKey) ?? 0;

    const previousRevenue = revenueByMonth.get(previousKey) ?? 0;

    const revenueGrowth =
      previousRevenue > 0
        ? Number(
            (
              ((monthlyRevenue - previousRevenue) /
                previousRevenue) *
              100
            ).toFixed(2),
          )
        : null;

    // ==========================================
    // RECENT ACTIVITIES
    // ==========================================

    const activities = [
      ...recentPayments.map((payment) => ({
        id: `payment-${payment.id}`,
        type: "PAYMENT",
        title: `${payment.profiles?.full_name ?? "Người thuê"} đã thanh toán`,
        description: `Phòng ${payment.invoices.rental_contracts.rooms.room_number}`,
        createdAt: formatActivityDate(
          payment.payment_date ?? now,
        ),
      })),

      ...recentContracts.map((contract) => ({
        id: `contract-${contract.id}`,
        type: "CONTRACT",
        title: "Hợp đồng mới được tạo",
        description: `Phòng ${contract.rooms.room_number} - ${contract.contract_number}`,
        createdAt: formatActivityDate(contract.created_at),
      })),

      ...recentMeterReadings.map((reading) => ({
        id: `reading-${reading.id}`,
        type: "METER_READING",
        title: "Có cập nhật chỉ số điện nước",
        description: `Phòng ${reading.rooms.room_number} - ${reading.services.name}`,
        createdAt: formatActivityDate(reading.created_at),
      })),

      ...recentIncidents.map((incident) => ({
        id: `incident-${incident.id}`,
        type: "INCIDENT",
        title: "Có báo cáo sự cố tài sản",
        description: `Phòng ${incident.rooms.room_number} - ${incident.title}`,
        createdAt: formatActivityDate(incident.created_at),
      })),
    ];

    activities.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    );

    // ==========================================
    // FORMAT INVOICES
    // ==========================================

    const formattedInvoices = unpaidInvoices.map((invoice) => ({
      id: invoice.id.toString(),
      invoiceNumber: invoice.invoice_number,
      roomNumber:
        invoice.rental_contracts.rooms.room_number,
      totalAmount: toNumber(invoice.total_amount),
      paidAmount: toNumber(invoice.paid_amount),
      remainingAmount:
        toNumber(invoice.total_amount) -
        toNumber(invoice.paid_amount),
      dueDate: invoice.due_date.toISOString(),
      status: invoice.status,
    }));

    // ==========================================
    // FORMAT INCIDENTS
    // ==========================================

    const formattedIncidents = pendingIncidents.map(
      (incident) => ({
        id: incident.id.toString(),
        title: incident.title,
        roomNumber: incident.rooms.room_number,
        priority: incident.priority,
        status: incident.status,
        createdAt: incident.created_at.toISOString(),
      }),
    );

    // ==========================================
    // RETURN
    // ==========================================

    return {
      overview: {
        totalRooms,
        occupiedRooms: roomStatus.occupied,
        availableRooms: roomStatus.available,
        totalTenants,
        monthlyRevenue,
        previousRevenue,
        revenueGrowth,
        expiringContracts,
      },

      roomStatus,

      revenueChart,

      recentActivities: activities.slice(0, 8),

      unpaidInvoices: {
        total: unpaidInvoiceCount,
        items: formattedInvoices,
      },

      pendingIncidents: {
        total: pendingIncidentCount,
        items: formattedIncidents,
      },

      totalAssets,
    };
  },
};
