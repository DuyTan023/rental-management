
"use client";

import {
  Bell,
  LogOut,
  PanelLeftOpen,
  UserRound,
  ChevronDown,
  User,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const { data: session, status } = useSession();
  const [openUserMenu, setOpenUserMenu] = useState(false);

  const pathname = usePathname();

  // Ngày hiện tại
  const now = new Date();

  const weekday = now
    .toLocaleDateString("vi-VN", {
      weekday: "long",
    })
    .toLowerCase();

  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const formattedDate = `${weekday}, ${day} tháng ${month}, ${year}`;

  // Tiêu đề trang
  const menuItems = [
    { name: "Dashboard", href: "/landlord/dashboard" },
    { name: "Người dùng", href: "/landlord/profiles" },
    { name: "Phòng trọ", href: "/landlord/rooms" },
    { name: "Dịch vụ", href: "/landlord/services" },
    { name: "Hợp đồng", href: "/landlord/rental_contracts" },
    { name: "Chỉ số điện nước", href: "/landlord/meter_readings" },
    { name: "Hóa đơn", href: "/landlord/invoices" },
    { name: "Phòng đang thuê", href: "/tenant/room" },
    { name: "Hợp đồng thuê", href: "/tenant/contracts" },
    { name: "Người cùng thuê", href: "/tenant/roommates" },
    { name: "Hóa đơn", href: "/tenant/invoices" },
    { name: "Thanh toán", href: "/tenant/payments" },
    { name: "Lịch sử thanh toán", href: "/tenant/payment-history" },
    { name: "Chỉ số điện", href: "/tenant/reports/electricity" },
    { name: "Chỉ số nước", href: "/tenant/reports/water" },
    { name: "Lưu trú qua đêm", href: "/tenant/reports/overnight" },
    { name: "Hư hỏng tài sản", href: "/tenant/reports/damage" },
    { name: "Thông tin cá nhân", href: "/public/user/profile" },
    { name: "Đổi mật khẩu", href: "/tenant/change-password" },
    { name: "Thông báo", href: "/tenant/notifications" },
    { name: "Yêu cầu hỗ trợ", href: "/tenant/support" },
    { name: "Lưu trú qua đêm", href: "/landlord/overnight-stays"},
  ];

  const currentMenu = menuItems.find(
    (item) =>
      pathname === item.href ||
      pathname.startsWith(item.href + "/"),
  );

  const pageTitle = currentMenu?.name ?? "Dashboard";

  // Đăng xuất
  const handleLogout = async () => {
    setOpenUserMenu(false);

    await signOut({
      redirect: false,
    });

    window.location.href = "/public/auth/login";
  };

  const email =
    status === "loading"
      ? "Đang tải..."
      : session?.user?.email || "Tài khoản";

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-3 shadow-sm sm:px-4 md:px-5">

      {/* Left: Sidebar button + Page title */}
      <div className="flex min-w-0 items-center gap-2">
        {/* Nút mở Sidebar trên mobile */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new Event("toggle-sidebar"));
          }}
          aria-label="Mở sidebar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 md:hidden"
        >
          <PanelLeftOpen size={20} />
        </button>

        {/* Tiêu đề */}
        <div className="flex min-w-0 flex-col justify-center whitespace-nowrap leading-tight">
          <p className="truncate text-lg font-bold text-blue-600 md:text-xl">
            {pageTitle}
          </p>

          <p className="text-[10px] text-slate-500 sm:text-xs">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Right: Notification + User */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">

        {/* Notification */}
        <button
          type="button"
          aria-label="Thông báo"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-blue-600 transition hover:bg-blue-50"
        >
          <Bell size={21} />

          {/* Số thông báo - giao diện tĩnh */}
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* User Dropdown */}
        <div className="relative">

          {/* User button */}
          <button
            type="button"
            onClick={() => setOpenUserMenu((prev) => !prev)}
            aria-expanded={openUserMenu}
            aria-label="Menu tài khoản"
            className={`flex items-center gap-2 rounded-xl border p-1.5 transition-all duration-200 sm:gap-3 sm:px-3 sm:py-1.5 ${
              openUserMenu
                ? "border-blue-200 bg-blue-50"
                : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
            }`}
          >
            {/* Avatar */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 sm:h-9 sm:w-9">
              <UserRound size={19} />
            </div>

            {/* Email */}
            <div className="hidden min-w-0 text-left sm:block">
              <p className="max-w-[130px] truncate text-xs font-semibold text-slate-700 md:max-w-[190px] md:text-sm">
                {email}
              </p>

              <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
                Tài khoản của tôi
              </p>
            </div>

            {/* Arrow */}
            <ChevronDown
              size={16}
              className={`hidden shrink-0 text-slate-400 transition-transform duration-200 sm:block ${
                openUserMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {openUserMenu && (
            <>
              {/* Overlay đóng dropdown */}
              <button
                type="button"
                aria-label="Đóng menu tài khoản"
                onClick={() => setOpenUserMenu(false)}
                className="fixed inset-0 z-40 cursor-default"
              />

              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">

                {/* User information */}
                <div className="border-b border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <UserRound size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-400">
                        Đang đăng nhập
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                        {email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu actions */}
                <div className="p-2">
                  <Link
                    href="/public/user/profile"
                    onClick={() => setOpenUserMenu(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                  >
                    <User size={18} />
                    <span>Thông tin cá nhân</span>
                  </Link>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
