export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-200 rounded-2xl" />
          <div className="space-y-1">
            <div className="h-5 bg-slate-200 rounded w-20" />
            <div className="h-3 bg-slate-200 rounded w-16" />
          </div>
        </div>
        <div className="space-y-1 text-right">
          <div className="h-3 bg-slate-200 rounded w-20 ml-auto" />
          <div className="h-4 bg-slate-200 rounded w-28" />
        </div>
      </div>

      {/* Calendar skeleton */}
      <div className="bg-white border-b py-4 px-4">
        <div className="flex space-x-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="min-w-[80px] p-3 rounded-2xl bg-slate-100 space-y-1">
              <div className="h-3 bg-slate-200 rounded w-8 mx-auto" />
              <div className="h-6 bg-slate-200 rounded w-6 mx-auto" />
              <div className="h-2 bg-slate-200 rounded w-8 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Recorder skeleton */}
      <div className="max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="bg-white border rounded-3xl p-8 flex items-center justify-center space-x-6 mb-8">
          <div className="w-20 h-20 bg-slate-200 rounded-full" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded w-28" />
            <div className="h-8 bg-slate-200 rounded w-16" />
          </div>
        </div>

        {/* Matrix skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 min-h-[300px] space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-20" />
                  <div className="h-3 bg-slate-200 rounded w-28" />
                </div>
                <div className="h-6 w-6 bg-slate-200 rounded-lg" />
              </div>
              <div className="h-12 bg-white rounded-xl" />
              <div className="h-12 bg-white rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
