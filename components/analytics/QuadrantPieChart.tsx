"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Props {
  data: { category: string; count: number }[];
}

const COLORS = ["#ef4444", "#6366f1", "#f97316", "#94a3b8"];
const LABELS: Record<string, string> = {
  URGENT_IMPORTANT: "Do First",
  IMPORTANT_NOT_URGENT: "Schedule",
  URGENT_NOT_IMPORTANT: "Delegate",
  NOT_URGENT_NOT_IMPORTANT: "Eliminate",
};

export default function QuadrantPieChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: LABELS[d.category] || d.category,
    value: d.count,
  }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Quadrant Distribution</h3>
        <p className="text-slate-400 text-sm">No tasks to analyze.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Quadrant Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "13px" }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
