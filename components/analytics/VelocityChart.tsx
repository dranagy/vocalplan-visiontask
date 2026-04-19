"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface VelocityDataPoint {
  week: string;
  created: number;
  completed: number;
  velocity: number;
}

interface VelocityChartProps {
  data: VelocityDataPoint[];
}

export default function VelocityChart({ data }: VelocityChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    weekLabel: `Week of ${d.week}`,
  }));

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900 leading-none">Velocity Trend</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tasks created vs completed — last 4 weeks</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
            labelStyle={{ fontWeight: 700 }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Line
            type="monotone"
            dataKey="created"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#6366f1" }}
            name="Created"
          />
          <Line
            type="monotone"
            dataKey="completed"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#22c55e" }}
            name="Completed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
