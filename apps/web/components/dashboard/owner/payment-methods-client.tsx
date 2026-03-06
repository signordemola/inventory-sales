"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#059669", "#f97316", "#0ea5e9", "#eab308", "#8b5cf6"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PaymentMethodsClient({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            backgroundColor: "#fff",
            fontSize: "12px",
            fontWeight: "700",
          }}
          itemStyle={{ color: "#334155" }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => `₦${Number(value || 0).toLocaleString()}`}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
