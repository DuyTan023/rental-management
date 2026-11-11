// "use client";
// import { Home, PanelLeftClose, PanelLeftOpen } from "lucide-react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useEffect, useState } from "react";

// export default function Sidebar() {
//   //Trạng thái thu gọn sidebar mặc định là fase
//   const [isCollapsed, setIsCollapsed] = useState(false);

//   // Danh sách các item
//   const menuItems = [
//     { name: "Dashboard", href: "/landlord/dashboard", icon: "📊" },
//     { name: "Người dùng", href: "/landlord/profiles", icon: "👥" },
//     { name: "Phòng trọ", href: "/landlord/rooms", icon: "🏠" },
//     { name: "Dịch vụ", href: "/landlord/services", icon: "⚙️" },
//     { name: "Hợp đồng", href: "/landlord/rental_contracts", icon: "📄" },
//     { name: "Chỉ số điện nước", href: "/landlord/meter_readings", icon: "🚰" },
//     { name: "Hóa đơn", href: "/landlord/invoices", icon: "🧾" },
//     { name: "Lưu trú qua đêm", href: "/landlord/overnight-stays", icon: "🌛" },
//     { name: "Quản lý tài sản", href: "/landlord/incidents", icon: "🏢" },
//   ];

//   const pathname = usePathname();

//   useEffect(() => {
//     const handleToggle = () => setIsCollapsed((prev) => !prev);
//     window.addEventListener("toggle-sidebar", handleToggle);
//     return () => window.removeEventListener("toggle-sidebar", handleToggle);
//   }, []);

//   return (
//     <aside
//       className={`
//           /* Cấu hình vị trí Mobile: Fixed đè lên trên */
//           fixed inset-y-0 left-0 z-50
//           /* Cấu hình vị trí PC (md trở lên): Sticky đẩy khung layout */
//           md:sticky md:top-0 md:z-auto
//           h-screen shrink-0 border-r bg-white shadow-lg md:shadow-sm
//           flex flex-col transition-all duration-300 ease-in-out
//           ${isCollapsed ? "-translate-x-full md:translate-x-0 md:w-16 sm:md:w-20" : "w-64 md:w-60 translate-x-0"}
//         `}
//     >
//       {/* Phần header logo  */}
//       <div
//         className={`flex h-14 sm:h-16 shrink-0 items-center border-b px-3 ${
//           isCollapsed ? "justify-center" : "justify-between"
//         }`}
//       >
//         {isCollapsed ? (
//           <button
//             onClick={() => setIsCollapsed(false)}
//             className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition"
//             title="Mở rộng Sidebar"
//           >
//             <PanelLeftOpen size={22} />
//           </button>
//         ) : (
//           <>
//             <div className="flex items-center gap-3 overflow-hidden">
//               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
//                 <Home size={22} />
//               </div>
//               <div className="flex flex-col whitespace-nowrap">
//                 <h1 className="text-xl font-bold text-blue-600 leading-tight">
//                   Xóm cũ
//                 </h1>
//                 <p className="text-xs text-gray-400">Design by KTT</p>
//               </div>
//             </div>

//             <button
//               onClick={() => setIsCollapsed(true)}
//               className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition"
//               title="Thu gọn Sidebar"
//             >
//               <PanelLeftClose size={20} />
//             </button>
//           </>
//         )}
//       </div>

//       {/* Phần Menu Nav: Tự động hiện con lăn cuộn độc lập khi nội dung dài */}
//       <nav className="flex-1 overflow-y-auto p-3">
//         <div className="space-y-1">
//           {menuItems.map((item) => {
//             const active =
//               pathname === item.href ||
//               (item.href !== "/admin" && pathname.startsWith(item.href));
//             return (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 title={isCollapsed ? item.name : undefined}
//                 className={`group relative flex items-center gap-3 rounded-xl transition-all duration-200 ease-in-out ${
//                   isCollapsed
//                     ? "w-8 h-8 sm:w-10 sm:h-10 justify-center p-0 mx-auto"
//                     : "w-full px-4 py-3"
//                 } ${
//                   active
//                     ? "bg-blue-50 text-blue-600 font-semibold shadow-xs"
//                     : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
//                 }`}
//               >
//                 {/* Thanh vạch màu xanh đánh dấu Active bên mép trái */}
//                 {active && (
//                   <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 sm:w-1.5 h-6 bg-blue-600 rounded-r-full" />
//                 )}

//                 {/* Icon: Có hiệu ứng phóng to nhẹ khi Hover hoặc khi Active */}
//                 <span
//                   className={`flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${
//                     active ? "scale-110 text-blue-600" : ""
//                   } ${isCollapsed ? "text-base sm:text-lg" : "text-lg"}`}
//                 >
//                   {item.icon}
//                 </span>

//                 {/* Tên Menu: Chữ nét căng, ẩn khi thu gọn */}
//                 {!isCollapsed && (
//                   <span className="whitespace-nowrap rou text-sm tracking-wide transition-colors">
//                     {item.name}
//                   </span>
//                 )}
//               </Link>
//             );
//           })}
//         </div>
//       </nav>
//     </aside>
//   );
// }



"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

// ==========================================
// TYPES
// ==========================================

type DashboardSummary = {
  overview: {
    expiringContracts: number;
  };
  unpaidInvoices: {
    total: number;
  };
  pendingIncidents: {
    total: number;
  };
};

type MenuItem = {
  name: string;
  href: string;
  icon: string;
  count?: number;
  badgeColor?: string;
};

// ==========================================
// COMPONENT
// ==========================================

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const pathname = usePathname();

  // ==========================================
  // FETCH NOTIFICATION COUNTS
  // ==========================================

  useEffect(() => {
    let active = true;

    async function fetchSummary() {
      try {
        const response = await fetch("/api/landlord/dashboard", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) return;

        const result = await response.json();

        if (active && result.data) {
          setSummary(result.data);
        }
      } catch (error) {
        console.error("Không thể tải thông báo Sidebar:", error);
      }
    }

    fetchSummary();

    // Cập nhật khi quay lại tab
    const handleFocus = () => fetchSummary();

    window.addEventListener("focus", handleFocus);

    // Tự động cập nhật mỗi 60 giây
    const interval = window.setInterval(fetchSummary, 60000);

    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
      window.clearInterval(interval);
    };
  }, []);

  // ==========================================
  // SIDEBAR TOGGLE EVENT
  // ==========================================

  useEffect(() => {
    const handleToggle = () => {
      setIsCollapsed((prev) => !prev);
    };

    window.addEventListener("toggle-sidebar", handleToggle);

    return () => {
      window.removeEventListener("toggle-sidebar", handleToggle);
    };
  }, []);

  // ==========================================
  // MENU ITEMS
  // ==========================================

  const menuItems: MenuItem[] = [
    {
      name: "Dashboard",
      href: "/landlord/dashboard",
      icon: "📊",
    },
    {
      name: "Người dùng",
      href: "/landlord/profiles",
      icon: "👥",
    },
    {
      name: "Phòng trọ",
      href: "/landlord/rooms",
      icon: "🏠",
    },
    {
      name: "Dịch vụ",
      href: "/landlord/services",
      icon: "⚙️",
    },
    {
      name: "Hợp đồng",
      href: "/landlord/rental_contracts",
      icon: "📄",
      count: summary?.overview.expiringContracts ?? 0,
      badgeColor: "bg-yellow-100 text-yellow-700",
    },
    {
      name: "Chỉ số điện nước",
      href: "/landlord/meter_readings",
      icon: "🚰",
    },
    {
      name: "Hóa đơn",
      href: "/landlord/invoices",
      icon: "🧾",
      count: summary?.unpaidInvoices.total ?? 0,
      badgeColor: "bg-orange-100 text-orange-700",
    },
    {
      name: "Lưu trú qua đêm",
      href: "/landlord/overnight-stays",
      icon: "🌛",
    },
    {
      name: "Quản lý tài sản",
      href: "/landlord/incidents",
      icon: "🏢",
      count: summary?.pendingIncidents.total ?? 0,
      badgeColor: "bg-red-100 text-red-700",
    },
    {
      name: "Tài khoản thanh toán",
      href: "/landlord/payment-accounts",
      icon: "💳",
    },
  ];

  // ==========================================
  // HELPERS
  // ==========================================

  const formatCount = (count: number) => {
    return count > 99 ? "99+" : count;
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50
        md:sticky md:top-0 md:z-auto
        h-screen shrink-0 border-r bg-white shadow-lg md:shadow-sm
        flex flex-col transition-all duration-300 ease-in-out
        ${
          isCollapsed
            ? "-translate-x-full md:translate-x-0 md:w-16"
            : "w-64 translate-x-0 md:w-60"
        }
      `}
    >
      {/* HEADER */}

      <div
        className={`flex h-14 sm:h-16 shrink-0 items-center border-b px-3 ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        {isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-blue-600"
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
                <h1 className="text-xl font-bold leading-tight text-blue-600">
                  Xóm cũ
                </h1>

                <p className="text-xs text-gray-400">
                  Design by KTT
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCollapsed(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-blue-600"
              title="Thu gọn Sidebar"
            >
              <PanelLeftClose size={20} />
            </button>
          </>
        )}
      </div>

      {/* MENU */}

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            const hasNotification = (item.count ?? 0) > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={
                  isCollapsed
                    ? `${item.name}${
                        hasNotification ? ` (${item.count} cần chú ý)` : ""
                      }`
                    : undefined
                }
                className={`
                  group relative flex items-center rounded-xl
                  transition-all duration-200 ease-in-out
                  ${
                    isCollapsed
                      ? "mx-auto h-10 w-10 justify-center p-0"
                      : "w-full gap-3 px-4 py-3"
                  }
                  ${
                    active
                      ? "bg-blue-50 font-semibold text-blue-600 shadow-xs"
                      : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                  }
                `}
              >
                {/* ACTIVE INDICATOR */}

                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
                )}

                {/* ICON */}

                <span
                  className={`
                    relative flex shrink-0 items-center justify-center
                    text-lg transition-transform duration-200
                    group-hover:scale-110
                    ${active ? "scale-110" : ""}
                  `}
                >
                  {item.icon}

                  {/* NOTIFICATION WHEN COLLAPSED */}

                  {isCollapsed && hasNotification && (
                    <span
                      className={`
                        absolute -right-2 -top-2
                        flex h-[17px] min-w-[17px] items-center justify-center
                        rounded-full border-2 border-white px-1
                        text-[9px] font-bold text-white
                        ${
                          item.badgeColor?.includes("red")
                            ? "bg-red-500"
                            : item.badgeColor?.includes("orange")
                              ? "bg-orange-500"
                              : "bg-yellow-500"
                        }
                      `}
                    >
                      {formatCount(item.count ?? 0)}
                    </span>
                  )}
                </span>

                {/* MENU NAME */}

                {!isCollapsed && (
                  <span className="min-w-0 flex-1 whitespace-nowrap text-sm tracking-wide">
                    {item.name}
                  </span>
                )}

                {/* NOTIFICATION BADGE WHEN EXPANDED */}

                {!isCollapsed && hasNotification && (
                  <span
                    className={`
                      flex h-5 min-w-5 shrink-0 items-center justify-center
                      rounded-full px-1.5 text-[10px] font-bold
                      ${item.badgeColor}
                    `}
                  >
                    {formatCount(item.count ?? 0)}
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
