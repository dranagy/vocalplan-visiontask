"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { TaskStatus } from "@/types";

interface AutomationBuilderProps {
  onSaved: () => void;
  onCancel: () => void;
}

const TRIGGER_TYPES = [
  { value: "task_status_change", label: "When task status changes to DONE" },
  { value: "task_overdue", label: "When task is overdue" },
  { value: "recurring", label: "Recurring (daily/weekly)" },
];

const ACTION_TYPES = [
  { value: "create_task", label: "Create follow-up task" },
  { value: "webhook", label: "Call webhook URL" },
  { value: "notify", label: "Show notification" },
];

const STATUS_OPTIONS = Object.values(TaskStatus);

export default function AutomationBuilder({ onSaved, onCancel }: AutomationBuilderProps) {
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("task_status_change");
  const [toStatus, setToStatus] = useState("DONE");
  const [recurringDay, setRecurringDay] = useState("monday");
  const [recurringTime, setRecurringTime] = useState("09:00");
  const [actionType, setActionType] = useState("create_task");
  const [titleTemplate, setTitleTemplate] = useState("Follow-up: {{task.title}}");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const buildTriggerConfig = () => {
    if (triggerType === "task_status_change") return JSON.stringify({ toStatus });
    if (triggerType === "recurring") return JSON.stringify({ day: recurringDay, time: recurringTime });
    return "{}";
  };

  const buildActionConfig = () => {
    if (actionType === "create_task") return JSON.stringify({ titleTemplate });
    if (actionType === "webhook") return JSON.stringify({ url: webhookUrl });
    return "{}";
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Automation name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          triggerType,
          triggerConfig: buildTriggerConfig(),
          actionType,
          actionConfig: buildActionConfig(),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Automation created!");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save automation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Create follow-up when task is done"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Trigger */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Trigger</label>
        <select
          value={triggerType}
          onChange={(e) => setTriggerType(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {TRIGGER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {triggerType === "task_status_change" && (
          <div className="mt-2">
            <label className="block text-xs text-slate-400 mb-1">When status changes to:</label>
            <select
              value={toStatus}
              onChange={(e) => setToStatus(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {triggerType === "recurring" && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Day of week</label>
              <select
                value={recurringDay}
                onChange={(e) => setRecurringDay(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((d) => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Time</label>
              <input
                type="time"
                value={recurringTime}
                onChange={(e) => setRecurringTime(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Action</label>
        <select
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {ACTION_TYPES.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>

        {actionType === "create_task" && (
          <div className="mt-2">
            <label className="block text-xs text-slate-400 mb-1">Title template (use {"{{task.title}}"})</label>
            <input
              type="text"
              value={titleTemplate}
              onChange={(e) => setTitleTemplate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        )}

        {actionType === "webhook" && (
          <div className="mt-2">
            <label className="block text-xs text-slate-400 mb-1">Webhook URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.example.com/..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-bold rounded-xl transition-colors"
        >
          {saving ? "Saving..." : "Save Automation"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
