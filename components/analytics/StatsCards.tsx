"use client";

interface StatsCardsProps {
  total: number;
  completed: number;
  rate: number;
  overdue: number;
}

const cards = [
  { key: "total", label: "Total Tasks", color: "text-indigo-600", bg: "bg-indigo-50" },
  { key: "completed", label: "Completed", color: "text-green-600", bg: "bg-green-50" },
  { key: "rate", label: "Completion Rate", color: "text-blue-600", bg: "bg-blue-50", suffix: "%" },
  { key: "overdue", label: "Overdue", color: "text-red-600", bg: "bg-red-50" },
];

export default function StatsCards({ total, completed, rate, overdue }: StatsCardsProps) {
  const values: Record<string, number> = { total, completed, rate, overdue };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.key} className={`${c.bg} rounded-2xl p-5 border border-transparent`}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{c.label}</p>
          <p className={`text-3xl font-black ${c.color}`}>
            {values[c.key]}
            {c.suffix || ""}
          </p>
        </div>
      ))}
    </div>
  );
}
