"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DataPoint {
  date: string;
  created: number;
  completed: number;
}

export default function CompletionChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Task Activity</h3>
        <p className="text-slate-400 text-sm">No data yet. Start recording voice notes!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Task Activity</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="created" stroke="#6366f1" strokeWidth={2} dot={false} name="Created" />
          <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={false} name="Completed" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
