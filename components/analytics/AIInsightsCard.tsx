"use client";

interface AIInsightsCardProps {
  insights: string[];
  loading?: boolean;
}

export default function AIInsightsCard({ insights, loading = false }: AIInsightsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900 leading-none">AI Insights</h3>
          <p className="text-xs text-slate-400 mt-0.5">Powered by Gemini AI</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3 items-start">
              <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-slate-100 rounded-full w-full" />
                <div className="h-3.5 bg-slate-100 rounded-full w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : insights.length === 0 ? (
        <p className="text-slate-400 text-sm">No insights available yet. Add more tasks to get AI-powered analytics.</p>
      ) : (
        <ul className="space-y-3">
          {insights.map((insight, idx) => (
            <li key={idx} className="flex gap-3 items-start">
              <span className="w-5 h-5 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </span>
              <p className="text-sm text-slate-700 leading-relaxed">{insight}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
