"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardSim, Clock, House, UsersRound, Wallet } from "lucide-react";
import { useState } from "react";

export default function Rooms() {
  const itemTabs = [
    {
      id: "total",
      icon: House,
      title: "Tổng số phòng",
      value: 20,
      cardBg: "bg-blue-50 hover:bg-blue-100",
      iconBg: "bg-blue-200",
      textColor: "text-blue-600",
      detailColor: "text-blue-500",
      // Sử dụng data-active thay vì data-selected
      activeRing:
        "data-active:ring-2 data-active:ring-blue-500 data-active:border-blue-500 data-active:bg-blue-100",
    },
    {
      id: "empty",
      icon: UsersRound,
      title: "Phòng trống",
      value: "4",
      cardBg: "bg-green-50 hover:bg-green-100",
      iconBg: "bg-green-200",
      textColor: "text-green-600",
      detailColor: "text-green-500",
      activeRing:
        "data-active:ring-2 data-active:ring-green-500 data-active:border-green-500 data-active:bg-green-100",
    },
    {
      id: "renting",
      icon: Wallet,
      title: "Đang cho thuê",
      value: 15,
      cardBg: "bg-orange-50 hover:bg-orange-100",
      iconBg: "bg-orange-200",
      textColor: "text-orange-600",
      detailColor: "text-orange-500",
      activeRing:
        "data-active:ring-2 data-active:ring-orange-500 data-active:border-orange-500, data-active:bg-orange-100",
    },
    {
      id: "repairing",
      icon: CardSim,
      title: "Đang sửa chữa",
      value: 1,
      cardBg: "bg-violet-50 hover:bg-violet-100",
      iconBg: "bg-violet-200",
      textColor: "text-violet-600",
      detailColor: "text-violet-500",
      activeRing:
        "data-active:ring-2 data-active:ring-violet-500 data-active:border-violet-500, data-active:bg-violet-100",
    },
    {
      id: "warning",
      icon: Clock,
      title: "Cảnh báo",
      value: 2,
      cardBg: "bg-red-50 hover:bg-red-100",
      iconBg: "bg-red-200",
      textColor: "text-red-600",
      detailColor: "text-red-500",
      activeRing:
        "data-active:ring-2 data-active:ring-red-500 data-active:border-red-500, data-active:bg-red-100",
    },
  ];
  const [activeTab, setActiveTab] = useState<string>("total");

  return (
    <div className="flex flex-col p-3 sm:p-4 md:p-5 gap-y-4">
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-black text-lg md:text-xl font-bold">
            Xin Chào, Kẻ thống trị
          </h1>
          <Button className="bg-blue-600 text-white font-bold hover:bg-blue-500">
            + Thêm phòng
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-5 gap-6 h-auto bg-transparent p-0">
            {itemTabs.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className={`
                    ${item.cardBg} ${item.activeRing}
                    flex items-center rounded-xl border border-transparent p-2 gap-2
                    transition-all duration-200 cursor-pointer
                    data-selected:bg-white data-[state=active]:bg-white
                    data-selected:shadow-md data-[state=active]:shadow-md
                    data-selected:scale-[1.02] data-[state=active]:scale-[1.02]
                  `}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 ${item.iconBg}`}
                  >
                    <Icon size={18} className={item.textColor} />
                  </div>

                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-700 truncate">
                      {item.title}
                    </p>
                    <p className="font-bold text-lg leading-5">{item.value}</p>
                  </div>
                  <p className={`text-[9px] shrink-0 ${item.detailColor}`}>
                    Chi tiết
                  </p>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
