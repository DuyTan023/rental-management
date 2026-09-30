"use client";

import { Bell, LogOut, PanelLeftOpen, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();

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

  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/public/auth/login",
    });
  };

  return (
    <div className="bg-white h-16 flex items-center justify-between border-b px-3 sm:px-4 md:px-5">
      <div className="flex items-center gap-2">
        {/* Nút mở Sidebar trên mobile */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new Event("toggle-sidebar"));
          }}
          className="flex h-9 w-9 items-center justify-center rounded-lg border text-gray-600 hover:bg-gray-100 md:hidden"
        >
          <PanelLeftOpen size={20} />
        </button>

        {/* Tiêu đề */}
        <div className="flex items-start flex-col whitespace-nowrap justify-center leading-tight">
          <p className="text-blue-600 text-lg md:text-xl font-bold">
            Dashboard
          </p>

          <p className="text-gray-500 text-[10px] sm:text-xs">
            {formattedDate}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        {/* Notification */}
        <div className="relative flex items-center justify-center w-6 h-6 md:w-9 md:h-9 rounded-xl ring-1 ring-blue-600 hover:bg-gray-100">
          <span className="absolute -right-1 -top-1 flex h-2.5 min-w-2.5 sm:h-4 sm:min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 sm:px-1 text-xs sm:text-sm font-bold text-white">
            3
          </span>

          <Bell size={18} className="text-blue-600 sm:w-[22px] sm:h-[22px]" />
        </div>

        {/* User */}
        <div className="flex h-7 sm:h-9 border-2 border-blue-600 text-gray-500 rounded-2xl whitespace-nowrap text-sm items-center gap-x-2 px-1 justify-between">
          <div className="flex items-center justify-center whitespace-nowrap gap-1 hover:bg-gray-200 rounded-xl p-0.5">
            <p className="hidden sm:block whitespace-nowrap">
              {status === "loading" ? "Đang tải..." : session?.user?.email}
            </p>

            <User size={20} />
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100"
            title="Đăng xuất"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
