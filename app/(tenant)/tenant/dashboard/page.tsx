
import Link from "next/link";
import {
  Home,
  FileText,
  Users,
  CreditCard,
  Receipt,
  Zap,
  Droplets,
  Moon,
  Wrench,
  UserRound,
  KeyRound,
  Bell,
  MessageSquareText,
  ClipboardList,
  ArrowUpRight,
  ChevronRight,
  Building2,
  Wallet,
  ShieldCheck,
} from "lucide-react";

const menuGroups = [
  {
    title: "QUẢN LÝ THUÊ PHÒNG",
    description: "Thông tin về nơi ở và hợp đồng thuê của bạn.",
    items: [
      {
        title: "Phòng đang thuê",
        description: "Xem thông tin phòng, địa chỉ và giá thuê.",
        icon: Home,
        color: "blue",
        href: "/tenant/room",
      },
      {
        title: "Hợp đồng thuê",
        description: "Xem hợp đồng, thời hạn và tiền đặt cọc.",
        icon: FileText,
        color: "violet",
        href: "/tenant/contracts",
      },
      {
        title: "Người cùng thuê",
        description: "Xem thông tin những người cùng phòng.",
        icon: Users,
        color: "cyan",
        href: "/tenant/roommates",
      },
    ],
  },
  {
    title: "HÓA ĐƠN VÀ THANH TOÁN",
    description: "Theo dõi các khoản phí và giao dịch của bạn.",
    items: [
      {
        title: "Hóa đơn",
        description: "Xem chi tiết tiền phòng và các khoản dịch vụ.",
        icon: Receipt,
        color: "orange",
        href: "/tenant/invoices",
      },
      {
        title: "Thanh toán",
        description: "Gửi yêu cầu xác nhận thanh toán.",
        icon: Wallet,
        color: "emerald",
        href: "/tenant/payments",
      },
      {
        title: "Lịch sử thanh toán",
        description: "Theo dõi các giao dịch đã thực hiện.",
        icon: CreditCard,
        color: "indigo",
        href: "/tenant/payment-history",
      },
    ],
  },
  {
    title: "KHAI BÁO VÀ BÁO CÁO",
    description: "Gửi thông tin và các yêu cầu đến chủ trọ.",
    items: [
      {
        title: "Chỉ số điện",
        description: "Khai báo chỉ số điện sử dụng.",
        icon: Zap,
        color: "amber",
        href: "/tenant/reports/electricity",
      },
      {
        title: "Chỉ số nước",
        description: "Khai báo chỉ số nước sử dụng.",
        icon: Droplets,
        color: "sky",
        href: "/tenant/reports/water",
      },
      {
        title: "Lưu trú qua đêm",
        description: "Khai báo người thân hoặc khách ở qua đêm.",
        icon: Moon,
        color: "violet",
        href: "/tenant/reports/overnight",
      },
      {
        title: "Hư hỏng tài sản",
        description: "Báo cáo thiết bị hoặc tài sản bị hư hỏng.",
        icon: Wrench,
        color: "rose",
        href: "/tenant/reports/damage",
      },
    ],
  },
  {
    title: "TÀI KHOẢN VÀ HỖ TRỢ",
    description: "Quản lý tài khoản và liên hệ với chủ trọ.",
    items: [
      {
        title: "Thông tin cá nhân",
        description: "Xem và cập nhật thông tin hồ sơ.",
        icon: UserRound,
        color: "blue",
        href: "/tenant/profile",
      },
      {
        title: "Đổi mật khẩu",
        description: "Thay đổi mật khẩu đăng nhập.",
        icon: KeyRound,
        color: "orange",
        href: "/tenant/change-password",
      },
      {
        title: "Thông báo",
        description: "Theo dõi thông báo từ hệ thống và chủ trọ.",
        icon: Bell,
        color: "amber",
        href: "/tenant/notifications",
      },
      {
        title: "Yêu cầu hỗ trợ",
        description: "Gửi thắc mắc hoặc yêu cầu đến chủ trọ.",
        icon: MessageSquareText,
        color: "emerald",
        href: "/tenant/support",
      },
    ],
  },
];

const colorStyles: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
  violet: "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
  cyan: "bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100",
  orange: "bg-orange-50 text-orange-600 group-hover:bg-orange-100",
  emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
  indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
  amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
  sky: "bg-sky-50 text-sky-600 group-hover:bg-sky-100",
  rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-100",
};

export default function TenantDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-7 md:py-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Tiêu đề trang */}
        <section>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Building2 size={16} />
            <span>Xóm Cũ</span>
            <ChevronRight size={14} />
            <span className="text-blue-600">Trang chủ</span>
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
              Xin chào, người thuê!
            </h1>
            <p className="mt-2 text-sm text-slate-500 md:text-base">
              Chào mừng bạn đến với hệ thống quản lý phòng trọ Xóm Cũ.
              Hãy chọn chức năng bạn muốn sử dụng.
            </p>
          </div>
        </section>

        {/* Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-sm md:p-8">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-blue-50">
              <ShieldCheck size={15} />
              Khu vực dành cho người thuê
            </div>

            <h2 className="mt-4 text-xl font-bold md:text-2xl">
              Mọi thông tin thuê phòng trong tầm tay
            </h2>

            <p className="mt-2 text-sm leading-6 text-blue-100">
              Quản lý hợp đồng, theo dõi hóa đơn, thực hiện thanh toán
              và gửi các báo cáo cho chủ trọ một cách thuận tiện.
            </p>
          </div>

          <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-36 right-36 h-64 w-64 rounded-full bg-white/10" />

          <Building2
            size={150}
            strokeWidth={1}
            className="absolute bottom-2 right-8 hidden text-white/15 md:block"
          />
        </section>

        {/* Nhóm chức năng */}
        {menuGroups.map((group, index) => (
          <section key={group.title}>
            <div className="mb-4">
              <h2 className="text-sm font-bold tracking-wider text-slate-700">
                {group.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {group.description}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex min-h-[142px] items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        colorStyles[item.color]
                      }`}
                    >
                      <Icon size={23} strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-slate-800 transition-colors group-hover:text-blue-600">
                          {item.title}
                        </h3>
                        <ArrowUpRight
                          size={17}
                          className="shrink-0 text-slate-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-500"
                        />
                      </div>

                      <p className="mt-2 text-sm leading-5 text-slate-500">
                        {item.description}
                      </p>

                      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                        Truy cập chức năng
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {/* Hướng dẫn */}
        <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <ClipboardList size={22} />
            </div>

            <div>
              <h3 className="font-semibold text-slate-800">
                Bạn cần hỗ trợ?
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Nếu có vấn đề về phòng ở, hóa đơn hoặc các thiết bị
                trong phòng, hãy sử dụng chức năng Yêu cầu hỗ trợ
                để liên hệ với chủ trọ.
              </p>
              <Link
                href="/tenant/support"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Gửi yêu cầu hỗ trợ
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-5 text-center">
          <p className="text-xs text-slate-400">
            © Xóm Cũ - Hệ thống quản lý phòng trọ
          </p>
        </footer>
      </div>
    </main>
  );
}
