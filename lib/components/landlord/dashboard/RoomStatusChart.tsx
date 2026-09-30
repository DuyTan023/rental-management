"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Đang cho thuê", value: 10 },
  { name: "Phòng trống", value: 2 },
  { name: "Đang sửa chữa", value: 2 },
];

const COLORS = ["#60a5fa", "#86efac", "#fde68a"];

export default function RoomStatusChart() {
  return (
    <div className="w-full min-w-0 rounded-xl bg-white p-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="font-semibold text-gray-800">Tình trạng phòng trọ</h2>

        <p className="text-xs text-gray-500">Tổng cộng 14 phòng</p>
      </div>

      {/* Chart + Legend */}
      <div className="flex items-center justify-center gap-4">
        {/* Biểu đồ tròn */}
        <div className="h-[130px] w-[130px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chú thích */}
        <div className="flex flex-col gap-3">
          {data.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-5"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: COLORS[index],
                  }}
                />

                <span className="whitespace-nowrap text-xs text-gray-600">
                  {item.name}
                </span>
              </div>

              <span className="text-sm font-semibold text-gray-800">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
