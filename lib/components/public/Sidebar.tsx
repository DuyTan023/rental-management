"use client";
import { Home, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar() {
  //Trạng thái thu gọn sidebar mặc định là fase
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Danh sách các item
  const menuItems = [
    { name: "Dashboard", href: "/landlord/dashboard", icon: "📊" },
    { name: "Người dùng", href: "/admin/users", icon: "👥" },
    { name: "Phòng trọ", href: "/landlord/rooms", icon: "🏠" },
    { name: "Hợp đồng", href: "/admin/contracts", icon: "📄" },
    { name: "Hóa đơn", href: "/admin/invoices", icon: "💰" },
  ];

  const pathname = usePathname();

  useEffect(() => {
    const handleToggle = () => setIsCollapsed((prev) => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  return (
    <aside
      className={`
          /* Cấu hình vị trí Mobile: Fixed đè lên trên */
          fixed inset-y-0 left-0 z-50
          /* Cấu hình vị trí PC (md trở lên): Sticky đẩy khung layout */
          md:sticky md:top-0 md:z-auto
          h-screen shrink-0 border-r bg-white shadow-lg md:shadow-sm
          flex flex-col transition-all duration-300 ease-in-out
          ${isCollapsed ? "-translate-x-full md:translate-x-0 md:w-16 sm:md:w-20" : "w-64 md:w-60 translate-x-0"}
        `}
    >
      {/* Phần header logo  */}
      <div
        className={`flex h-14 sm:h-16 shrink-0 items-center border-b px-3 ${
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
                <p className="text-xs text-gray-400">Design by KTT</p>
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
                  isCollapsed
                    ? "w-8 h-8 sm:w-10 sm:h-10 justify-center p-0 mx-auto"
                    : "w-full px-4 py-3"
                } ${
                  active
                    ? "bg-blue-50 text-blue-600 font-semibold shadow-xs"
                    : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                }`}
              >
                {/* Thanh vạch màu xanh đánh dấu Active bên mép trái */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 sm:w-1.5 h-6 bg-blue-600 rounded-r-full" />
                )}

                {/* Icon: Có hiệu ứng phóng to nhẹ khi Hover hoặc khi Active */}
                <span
                  className={`flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    active ? "scale-110 text-blue-600" : ""
                  } ${isCollapsed ? "text-base sm:text-lg" : "text-lg"}`}
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
