
"use client";

import { useEffect, useState } from "react";

import RevenueChart from "@/lib/components/landlord/dashboard/RevenueChart";
import RoomStatusChart from "@/lib/components/landlord/dashboard/RoomStatusChart";

import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Home,
  Loader2,
  Receipt,
  UsersRound,
  Wallet,
  Zap,
} from "lucide-react";

import {
  ScrollArea,
  ScrollBar,
} from "@/components/ui/scroll-area";

// ==========================================
// TYPES
// ==========================================

type DashboardData = {
  overview: {
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    totalTenants: number;
    monthlyRevenue: number;
    previousRevenue: number;
    revenueGrowth: number | null;
    expiringContracts: number;
  };

  roomStatus: {
    occupied: number;
    available: number;
    maintenance: number;
    inactive: number;
  };

  revenueChart: {
    month: string;
    year: number;
    monthNumber: number;
    revenue: number;
  }[];

  recentActivities: {
    id: string;
    type: string;
    title: string;
    description: string;
    createdAt: string;
  }[];

  unpaidInvoices: {
    total: number;
    items: {
      id: string;
      invoiceNumber: string;
      roomNumber: string;
      totalAmount: number;
      paidAmount: number;
      remainingAmount: number;
      dueDate: string;
      status: string;
    }[];
  };

  pendingIncidents: {
    total: number;
    items: {
      id: string;
      title: string;
      roomNumber: string;
      priority: string;
      status: string;
      createdAt: string;
    }[];
  };

  totalAssets: number;
};

// ==========================================
// HELPERS
// ==========================================

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + "đ";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN");

function timeAgo(value: string) {
  const date = new Date(value);
  const now = new Date();

  const diff = Math.max(0, now.getTime() - date.getTime());

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 30) return `${days} ngày trước`;

  return formatDate(value);
}

// ==========================================
// ACTIVITY ICON
// ==========================================

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "PAYMENT":
      return <Wallet size={18} className="text-green-600" />;

    case "CONTRACT":
      return <FileText size={18} className="text-violet-600" />;

    case "METER_READING":
      return <Zap size={18} className="text-orange-600" />;

    case "INCIDENT":
      return <AlertTriangle size={18} className="text-red-500" />;

    default:
      return <Home size={18} className="text-blue-600" />;
  }
}

function activityBackground(type: string) {
  switch (type) {
    case "PAYMENT":
      return "bg-green-50";

    case "CONTRACT":
      return "bg-violet-50";

    case "METER_READING":
      return "bg-orange-50";

    case "INCIDENT":
      return "bg-red-50";

    default:
      return "bg-blue-50";
  }
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function Landloard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/landlord/dashboard", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Không thể lấy dữ liệu Dashboard."
          );
        }

        if (active) {
          setDashboard(result.data);
        }
      } catch (error) {
        if (active) {
          setError(
            error instanceof Error
              ? error.message
              : "Đã xảy ra lỗi khi tải Dashboard."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      active = false;
    };
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />

          <p className="text-sm text-gray-500">
            Đang tải dữ liệu Dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error || !dashboard) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-5">
        <AlertTriangle size={35} className="text-red-500" />

        <p className="text-center text-sm text-gray-600">
          {error || "Không có dữ liệu Dashboard."}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { overview, roomStatus } = dashboard;

  // ==========================================
  // OVERVIEW CARDS
  // ==========================================

  const overviewCards = [
    {
      icon: Building2,
      title: "Tổng số phòng trọ",
      value: `${overview.totalRooms} phòng`,
      info: `${overview.occupiedRooms} phòng đang cho thuê`,
      bg1: "bg-blue-50",
      bg2: "bg-blue-100",
      text: "text-blue-600",
    },
    {
      icon: UsersRound,
      title: "Tổng số người thuê",
      value: `${overview.totalTenants} người`,
      info: "Đang có hợp đồng hoạt động",
      bg1: "bg-green-50",
      bg2: "bg-green-100",
      text: "text-green-600",
    },
    {
      icon: Wallet,
      title: "Doanh thu tháng này",
      value: formatCurrency(overview.monthlyRevenue),
      info:
        overview.revenueGrowth === null
          ? "Chưa có dữ liệu tháng trước"
          : `${overview.revenueGrowth >= 0 ? "Tăng" : "Giảm"} ${Math.abs(
              overview.revenueGrowth
            )}% so tháng trước`,
      bg1: "bg-orange-50",
      bg2: "bg-orange-100",
      text: "text-orange-600",
    },
    {
      icon: CalendarClock,
      title: "Hợp đồng sắp hết hạn",
      value: `${overview.expiringContracts} hợp đồng`,
      info: "Trong 30 ngày tới",
      bg1: "bg-violet-50",
      bg2: "bg-violet-100",
      text: "text-violet-600",
    },
  ];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="w-full">
      <div className="flex flex-col gap-y-4 p-3 sm:p-4 md:p-5">

        {/* HEADER */}

        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-black md:text-xl">
            Xin chào, Chủ nhà
          </h1>

          <p className="text-[10px] text-gray-500 sm:text-xs">
            Chào mừng bạn quay trở lại trang quản lý. Dưới đây là tổng quan
            tình hình hoạt động của khu trọ.
          </p>
        </div>

        {/* OVERVIEW */}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
          {overviewCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className={`flex gap-1.5 rounded-xl border p-2 ${item.bg1}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${item.bg2}`}
                >
                  <Icon size={22} className={item.text} />
                </div>

                <div className="flex min-w-0 flex-1 flex-col text-gray-700 sm:gap-2">
                  <p className="text-xs sm:text-[15px]">
                    {item.title}
                  </p>

                  <p className="break-words text-base font-bold sm:text-xl">
                    {item.value}
                  </p>

                  <p className="text-[10px] sm:text-xs">
                    {item.info}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CHARTS + RECENT ACTIVITIES */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-10">

          {/* REVENUE */}

          <div className="col-span-1 min-w-0 sm:col-span-4">
            <RevenueChart data={dashboard.revenueChart} />
          </div>

          {/* ROOM STATUS */}

          <div className="col-span-1 min-w-0 sm:col-span-3">
            <RoomStatusChart data={roomStatus} />
          </div>

          {/* RECENT ACTIVITIES */}

          <div className="col-span-1 flex min-h-0 flex-col rounded-xl border bg-white p-4 sm:col-span-3">

            <div className="mb-3 flex shrink-0 items-center justify-between">
              <div className="flex items-center gap-x-2">
                <Clock size={18} className="text-blue-600" />

                <h2 className="font-semibold text-gray-800">
                  Hoạt động gần đây
                </h2>
              </div>

              <span className="text-xs text-gray-400">
                {dashboard.recentActivities.length} hoạt động
              </span>
            </div>

            {/* SCROLL AREA */}

            <ScrollArea className="h-[100px] w-full pr-3">
              <div className="flex flex-col gap-3">

                {dashboard.recentActivities.length === 0 ? (
                  <div className="flex min-h-[360px] items-center justify-center text-xs text-gray-400">
                    Chưa có hoạt động nào.
                  </div>
                ) : (
                  dashboard.recentActivities.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-x-2"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${activityBackground(
                          item.type
                        )}`}
                      >
                        <ActivityIcon type={item.type} />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="text-xs leading-5 text-gray-700">
                          {item.title}
                        </p>

                        <p className="text-[10px] text-gray-500">
                          {item.description}
                        </p>

                        <p className="mt-0.5 text-[10px] text-gray-400">
                          {timeAgo(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}

              </div>

              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        </div>

        {/* BOTTOM DASHBOARD */}

        <div className="w-full rounded-xl border bg-white p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            {/* UNPAID INVOICES */}

            <div className="min-h-46 rounded-xl border bg-white p-3">

              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt size={19} className="text-orange-500" />

                  <h2 className="text-sm font-semibold text-gray-800">
                    Hóa đơn chưa thanh toán
                  </h2>
                </div>

                <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600">
                  {dashboard.unpaidInvoices.total}
                </span>
              </div>

              {dashboard.unpaidInvoices.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                  <CheckCircle2 size={28} className="mb-2 text-green-500" />

                  <p className="text-xs">
                    Không có hóa đơn cần thanh toán.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y">
                  {dashboard.unpaidInvoices.items.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between gap-2 py-3"
                    >
                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="text-sm font-medium text-gray-700">
                          Phòng {invoice.roomNumber}
                        </p>

                        <p className="text-[10px] text-gray-400">
                          {invoice.invoiceNumber} · Hạn:{" "}
                          {formatDate(invoice.dueDate)}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-orange-600">
                          {formatCurrency(invoice.remainingAmount)}
                        </p>

                        <p className="text-[10px] text-gray-400">
                          {invoice.status === "OVERDUE"
                            ? "Quá hạn"
                            : invoice.status === "PARTIALLY_PAID"
                              ? "Thanh toán một phần"
                              : "Chưa thanh toán"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PENDING INCIDENTS */}

            <div className="min-h-46 rounded-xl border bg-white p-3">

              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={19} className="text-red-500" />

                  <h2 className="text-sm font-semibold text-gray-800">
                    Sự cố tài sản cần xử lý
                  </h2>
                </div>

                <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                  {dashboard.pendingIncidents.total}
                </span>
              </div>

              {dashboard.pendingIncidents.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                  <CheckCircle2 size={28} className="mb-2 text-green-500" />

                  <p className="text-xs">
                    Không có sự cố cần xử lý.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y">
                  {dashboard.pendingIncidents.items.map((incident) => (
                    <div
                      key={incident.id}
                      className="flex items-center justify-between gap-2 py-3"
                    >
                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="truncate text-sm font-medium text-gray-700">
                          {incident.title}
                        </p>

                        <p className="text-[10px] text-gray-400">
                          Phòng {incident.roomNumber} ·{" "}
                          {formatDate(incident.createdAt)}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                            incident.priority === "URGENT"
                              ? "bg-red-100 text-red-700"
                              : incident.priority === "HIGH"
                                ? "bg-orange-100 text-orange-700"
                                : incident.priority === "MEDIUM"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {incident.priority === "URGENT"
                            ? "Khẩn cấp"
                            : incident.priority === "HIGH"
                              ? "Cao"
                              : incident.priority === "MEDIUM"
                                ? "Trung bình"
                                : "Thấp"}
                        </span>

                        <p className="mt-1 text-[10px] text-gray-400">
                          {incident.status === "PENDING"
                            ? "Chờ xử lý"
                            : "Đang xử lý"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ASSET SUMMARY */}

          <div className="mt-4 flex items-center justify-between rounded-xl bg-blue-50 p-3">
            <div className="flex items-center gap-2">
              <Building2 size={20} className="text-blue-600" />

              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Tổng tài sản đang quản lý
                </p>

                <p className="text-[10px] text-gray-500">
                  Tài sản đang hoạt động tại các phòng
                </p>
              </div>
            </div>

            <p className="text-xl font-bold text-blue-600">
              {dashboard.totalAssets}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
