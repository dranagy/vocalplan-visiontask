"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface AutomationLog {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
}

interface Automation {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: string;
  triggerConfig: string;
  actionType: string;
  actionConfig: string;
  lastRunAt: string | null;
  createdAt: string;
  logs: AutomationLog[];
}

const TRIGGER_LABELS: Record<string, string> = {
  task_status_change: "Task status changes",
  task_overdue: "Task overdue",
  recurring: "Recurring schedule",
};

const ACTION_LABELS: Record<string, string> = {
  create_task: "Create follow-up task",
  webhook: "Call webhook",
  notify: "Show notification",
};

interface AutomationListProps {
  onNew: () => void;
}

export default function AutomationList({ onNew }: AutomationListProps) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/automations");
      if (res.ok) setAutomations(await res.json());
    } catch {
      toast.error("Failed to load automations");
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)));
    try {
      await fetch("/api/automations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      });
    } catch {
      toast.error("Failed to update automation");
      setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !enabled } : a)));
    }
  };

  const deleteAutomation = async (id: string) => {
    if (!window.confirm("Delete this automation?")) return;
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/automations?id=${id}`, { method: "DELETE" });
      toast.success("Automation deleted");
    } catch {
      toast.error("Failed to delete automation");
      loadAutomations();
    }
  };

  const formatTriggerSummary = (a: Automation) => {
    let config: Record<string, string> = {};
    try { config = JSON.parse(a.triggerConfig); } catch { config = {}; }
    if (a.triggerType === "task_status_change" && config.toStatus) {
      return `Status → ${config.toStatus}`;
    }
    if (a.triggerType === "recurring" && config.day) {
      return `Every ${config.day} at ${config.time || "09:00"}`;
    }
    return TRIGGER_LABELS[a.triggerType] || a.triggerType;
  };

  const formatActionSummary = (a: Automation) => {
    let config: Record<string, string> = {};
    try { config = JSON.parse(a.actionConfig); } catch { config = {}; }
    if (a.actionType === "create_task" && config.titleTemplate) {
      return `Create: "${config.titleTemplate}"`;
    }
    if (a.actionType === "webhook" && config.url) {
      return `POST → ${config.url.slice(0, 40)}...`;
    }
    return ACTION_LABELS[a.actionType] || a.actionType;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse h-20 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-slate-900">Automations</h2>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Automation
        </button>
      </div>

      {automations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
          <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-slate-400 font-medium">No automations yet</p>
          <p className="text-slate-300 text-sm mt-1">Create one to automate repetitive actions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((automation) => (
            <div key={automation.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{automation.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        automation.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {automation.enabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {formatTriggerSummary(automation)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      {formatActionSummary(automation)}
                    </span>
                  </div>
                  {automation.lastRunAt && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Last run: {new Date(automation.lastRunAt).toLocaleDateString()}
                    </p>
                  )}
                  {automation.logs.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          automation.logs[0].status === "success" ? "bg-green-400" : "bg-red-400"
                        }`}
                      />
                      <span className="text-[11px] text-slate-400">
                        Last: {automation.logs[0].status} — {automation.logs[0].message || "—"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleEnabled(automation.id, !automation.enabled)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      automation.enabled ? "bg-indigo-500" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        automation.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => deleteAutomation(automation.id)}
                    className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
