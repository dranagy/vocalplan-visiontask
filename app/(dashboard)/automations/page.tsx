"use client";

import { useState, useCallback } from "react";
import AutomationList from "@/components/automations/AutomationList";
import AutomationBuilder from "@/components/automations/AutomationBuilder";

export default function AutomationsPage() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = useCallback(() => {
    setShowBuilder(false);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-orange-200 shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 leading-none">Automations</h1>
          <p className="text-slate-400 text-sm mt-0.5">Automate repetitive actions in your workflow</p>
        </div>
      </div>

      {/* Modal for builder */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowBuilder(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-900">New Automation</h2>
              <button
                onClick={() => setShowBuilder(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AutomationBuilder
              onSaved={handleSaved}
              onCancel={() => setShowBuilder(false)}
            />
          </div>
        </div>
      )}

      <AutomationList key={refreshKey} onNew={() => setShowBuilder(true)} />
    </div>
  );
}
