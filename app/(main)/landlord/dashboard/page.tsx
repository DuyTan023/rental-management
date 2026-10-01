import RevenueChart from "@/lib/components/landlord/dashboard/RevenueChart";
import RoomStatusChart from "@/lib/components/landlord/dashboard/RoomStatusChart";
import { CardSim, Clock, Home, Houses, UsersRound, Wallet } from "lucide-react";

export default async function Landloard() {
  const overviewCards = [
    {
      icon: Houses,
      title: "Tổng số phòng trọ",
      vlaue: "12 phòng",
      info: "10 phòng đang cho thuê",
      bg1: "bg-blue-50",
      bg2: "bg-blue-100",
      text: "text-blue-600",
    },
    {
      icon: UsersRound,
      title: "Tổng số người thuê",
      vlaue: "10 người",
      info: "8 người ở | 2 người rời",
      bg1: "bg-green-50",
      bg2: "bg-green-100",
      text: "text-green-600",
    },
    {
      icon: Wallet,
      title: "Doanh thu tháng này",
      vlaue: "12.500.000đ",
      info: "Tăng 18% so tháng trước",
      bg1: "bg-orange-50",
      bg2: "bg-orange-100",
      text: "text-orange-600",
    },
    {
      icon: CardSim,
      title: "Hợp đồng sắp hết hạn",
      vlaue: "2 hợp đồng",
      info: "Trong 30 ngày tới",
      bg1: "bg-violet-50",
      bg2: "bg-violet-100",
      text: "text-violet-600",
    },
  ];
  return (
    <div className="w-full">
      <div className="flex flex-col p-3 sm:p-4 md:p-5 gap-y-4">
        <div className="flex flex-col">
          <h1 className="text-black text-lg md:text-xl font-bold">
            Xin Chào, Kẻ thống trị
          </h1>
          <p className="text-gray-500 text-[10px] sm:text-xs">
            Chào mừng bạn quay trở lại trang quản lý. Dưới đây là tổng quan tình
            hình hoạt động của khu trọ.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          {overviewCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`flex ${item.bg1} rounded-xl border p-2 gap-1.5`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 ${item.bg2} rounded-2xl`}
                >
                  <Icon size={22} className={`${item.text}`} />
                </div>

                <div className="flex flex-col flex-1 text-gray-700 sm:gap-2">
                  <p className="text-xs sm:text-[15px]">{item.title}</p>
                  <p className="font-bold text-xl">{item.vlaue}</p>
                  <p className="text-[10px] sm:text-xs">{item.info}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-10">
          <div className="col-span-1 min-w-0 sm:col-span-4">
            <RevenueChart />
          </div>

          <div className="col-span-1 min-w-0 sm:col-span-3">
            <RoomStatusChart />
          </div>

          <div className="col-span-1 min-w-0 rounded-xl border bg-white p-4 sm:col-span-3 flex flex-col min-h-0">
            {/* Header */}
            <div className="mb-1.5 flex shrink-0 justify-between">
              <div className="flex gap-x-2 items-center">
                <Clock size={18} className="text-blue-600" />
                <h2 className="font-semibold text-gray-800">
                  Hoạt động gần đây
                </h2>
              </div>

              <p className="text-xs text-blue-600">Xem thêm</p>
            </div>

            {/* 5 ô */}
            <div className="grid flex-1 min-h-0 grid-rows-4 gap-0.5">
              {Array.from({ length: 4 }, (_, i) => {
                return (
                  <div key={i}>
                    <div className="flex min-h-0 rounded-xl items-center gap-x-2">
                      <div className="flex items-center w-8 h-8 bg-blue-50 rounded-2xl justify-center">
                        <Home size={18} />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[15px] text-gray-600">
                          Nguyễn Văn A đã thanh toán phòng A101
                        </p>
                        <p className="text-[10px] text-gray-400">2 giờ trước</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex-1 w-full  rounded-xl border bg-white p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-h-46 rounded-xl border bg-gray-200">Ô 1</div>

            <div className="min-h-32 rounded-xl border bg-gray-200">Ô 2</div>
          </div>
        </div>
      </div>
    </div>
  );
}
