"use client";

import { useState, useEffect } from "react";
import StatsCards from "@/components/analytics/StatsCards";
import CompletionChart from "@/components/analytics/CompletionChart";
import QuadrantPieChart from "@/components/analytics/QuadrantPieChart";

interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  quadrantDistribution: { category: string; count: number }[];
  overdueCount: number;
  dailyCompletions: { date: string; created: number; completed: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?range=${range}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => console.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [range]);

  const ranges: { value: "7d" | "30d" | "90d"; label: string }[] = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-slate-900">Analytics</h1>
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-full">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                range === r.value
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
            ))}
          </div>
          <div className="h-80 bg-slate-100 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <StatsCards
            total={data.totalTasks}
            completed={data.completedTasks}
            rate={data.completionRate}
            overdue={data.overdueCount}
          />

          <CompletionChart data={data.dailyCompletions} />

          <QuadrantPieChart data={data.quadrantDistribution} />
        </div>
      )}
    </div>
  );
}
