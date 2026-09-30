"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { month: "Th4", revenue: 8 },
  { month: "Th5", revenue: 10 },
  { month: "Th6", revenue: 9 },
  { month: "Th7", revenue: 12 },
  { month: "Th8", revenue: 11 },
  { month: "Th9", revenue: 12.5 },
];

export default function RevenueChart() {
  return (
    <div className="w-full rounded-xl bg-white p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800">
            Doanh thu 6 tháng gần đây
          </h2>
          <p className="text-xs text-gray-500">Đơn vị: triệu đồng</p>
        </div>

        <select className="rounded-lg border px-2 py-1 text-xs text-gray-600 outline-none">
          <option>6 tháng</option>
          <option>12 tháng</option>
        </select>
      </div>

      {/* Chart */}
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis dataKey="month" tickLine={false} axisLine={false} />

            <YAxis tickLine={false} axisLine={false} />

            <Tooltip />

            <Bar
              dataKey="revenue"
              fill="#2563eb"
              radius={[6, 6, 0, 0]}
              barSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
