"use client";

import { Home, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar() {
  //Trạng thái thu gọn sidebar mặc định là fase
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Danh sách các item
  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: "📊" },
    { name: "Người dùng", href: "/admin/users", icon: "👥" },
    { name: "Phòng trọ", href: "/admin/rooms", icon: "🏠" },
    { name: "Hợp đồng", href: "/admin/contracts", icon: "📄" },
    { name: "Hóa đơn", href: "/admin/invoices", icon: "💰" },
  ];

  const pathname = usePathname();

  return (
    <aside
      className={`sticky top-0 h-screen shrink-0 border-r bg-white shadow-sm transition-all duration-300 flex flex-col ${
        isCollapsed ? "w-20" : "w-60"
      }`}
    >
      {/* Phần header logo  */}
      <div
        className={`flex h-16 shrink-0 items-center border-b px-3 ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        {isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition"
            title="Mở rộng Sidebar"
          >
            <PanelLeftOpen size={22} />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Home size={22} />
              </div>
              <div className="flex flex-col whitespace-nowrap">
                <h1 className="text-xl font-bold text-blue-600 leading-tight">
                  Xóm cũ
                </h1>
                <p className="text-xs text-gray-400">User Panel</p>
              </div>
            </div>

            <button
              onClick={() => setIsCollapsed(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition"
              title="Thu gọn Sidebar"
            >
              <PanelLeftClose size={20} />
            </button>
          </>
        )}
      </div>

      {/* Phần Menu Nav: Tự động hiện con lăn cuộn độc lập khi nội dung dài */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`group relative flex items-center gap-3 rounded-xl transition-all duration-200 ease-in-out ${
                  isCollapsed ? "justify-center p-2.5" : "px-4 py-3"
                } ${
                  active
                    ? "bg-blue-50 text-blue-600 font-semibold shadow-xs"
                    : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                }`}
              >
                {/* Thanh vạch màu xanh đánh dấu Active bên mép trái */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-600 rounded-r-full" />
                )}

                {/* Icon: Có hiệu ứng phóng to nhẹ khi Hover hoặc khi Active */}
                <span
                  className={`flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    active ? "scale-110 text-blue-600" : ""
                  } ${isCollapsed ? "text-xl" : "text-lg"}`}
                >
                  {item.icon}
                </span>

                {/* Tên Menu: Chữ nét căng, ẩn khi thu gọn */}
                {!isCollapsed && (
                  <span className="whitespace-nowrap rou text-sm tracking-wide transition-colors">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
