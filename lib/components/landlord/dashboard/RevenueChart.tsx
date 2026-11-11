
"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenueChartItem = {
  month: string;
  revenue: number;
};

type RevenueChartProps = {
  data: RevenueChartItem[];
};

export default function RevenueChart({
  data,
}: RevenueChartProps) {
  const [range, setRange] = useState<6 | 12>(6);

  const chartData = data.slice(-range).map((item) => ({
    ...item,
    revenue: item.revenue / 1_000_000,
  }));

  return (
    <div className="w-full rounded-xl bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800">
            Doanh thu {range} tháng gần đây
          </h2>
          <p className="text-xs text-gray-500">
            Đơn vị: triệu đồng
          </p>
        </div>

        <select
          value={range}
          onChange={(e) =>
            setRange(Number(e.target.value) as 6 | 12)
          }
          className="rounded-lg border px-2 py-1 text-xs text-gray-600 outline-none"
        >
          <option value={6}>6 tháng</option>
          <option value={12}>12 tháng</option>
        </select>
      </div>

      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: -15,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
            />

            <Tooltip
              formatter={(value) => [
                `${Number(value).toLocaleString("vi-VN")} triệu đồng`,
                "Doanh thu",
              ]}
            />

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
