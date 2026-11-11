
"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type RoomStatusChartProps = {
  data: {
    occupied: number;
    available: number;
    maintenance: number;
    inactive: number;
  };
};

const COLORS = [
  "#60a5fa",
  "#86efac",
  "#fde68a",
  "#c4b5fd",
];

export default function RoomStatusChart({
  data,
}: RoomStatusChartProps) {
  const chartData = [
    { name: "Đang cho thuê", value: data.occupied },
    { name: "Phòng trống", value: data.available },
    { name: "Đang sửa chữa", value: data.maintenance },
    { name: "Ngừng hoạt động", value: data.inactive },
  ];

  const total = chartData.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  return (
    <div className="w-full min-w-0 rounded-xl bg-white p-4">
      <div className="mb-4">
        <h2 className="font-semibold text-gray-800">
          Tình trạng phòng trọ
        </h2>

        <p className="text-xs text-gray-500">
          Tổng cộng {total} phòng
        </p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <div className="h-[130px] w-[130px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((item, index) => (
                  <Cell
                    key={item.name}
                    fill={COLORS[index]}
                  />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-3">
          {chartData.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-3"
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
