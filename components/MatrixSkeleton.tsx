export default function MatrixSkeleton() {
  const quadrants = [
    { bg: "bg-red-50", border: "border-red-200" },
    { bg: "bg-indigo-50", border: "border-indigo-200" },
    { bg: "bg-orange-50", border: "border-orange-200" },
    { bg: "bg-slate-50", border: "border-slate-200" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-w-6xl mx-auto w-full">
      {quadrants.map((q, i) => (
        <div
          key={i}
          className={`${q.bg} border ${q.border} rounded-3xl p-6 flex flex-col min-h-[300px] animate-pulse`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <div className="h-5 bg-slate-200 rounded-lg w-24" />
              <div className="h-3 bg-slate-200 rounded-lg w-32" />
            </div>
            <div className="h-6 w-6 bg-slate-200 rounded-lg" />
          </div>
          <div className="flex-grow space-y-2">
            <div className="h-12 bg-white/60 rounded-xl border border-slate-100" />
            <div className="h-12 bg-white/60 rounded-xl border border-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
