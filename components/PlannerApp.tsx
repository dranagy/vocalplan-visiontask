"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import CalendarWheel from "./CalendarWheel";
import VoiceRecorder from "./VoiceRecorder";
import EisenhowerMatrix from "./EisenhowerMatrix";
import MatrixSkeleton from "./MatrixSkeleton";
import VoiceNoteList from "./VoiceNoteList";
import TeamSelector from "./TeamSelector";
import { Task, TaskCategory, EisenhowerMatrixData, VoiceNote, Team } from "../types";
import toast from "react-hot-toast";

export type AIProvider = "gemini" | "glm";

const App: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [provider, setProvider] = useState<AIProvider>("gemini");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = localStorage.getItem("eisenhower_teams");
      if (!cached) return [];
      const parsed = JSON.parse(cached);
      return Array.isArray(parsed) ? (parsed as Team[]) : [];
    } catch {
      return [];
    }
  });
  const pathname = usePathname();

  // Load AI provider preference from localStorage
  useEffect(() => {
    const savedProvider = localStorage.getItem("eisenhower_provider");
    if (savedProvider === "gemini" || savedProvider === "glm") {
      setProvider(savedProvider);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("eisenhower_provider", provider);
  }, [provider]);

  // Fetch user's teams — refetch on mount and every navigation to planner
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data = await res.json();
          setTeams(data);
          try {
            localStorage.setItem("eisenhower_teams", JSON.stringify(data));
          } catch {
            // ignore storage errors
          }
        }
      } catch (err) {
        console.error("Failed to fetch teams:", err);
      }
    };
    fetchTeams();
  }, [pathname]);

  // Load saved team context
  useEffect(() => {
    const saved = localStorage.getItem("eisenhower_teamId");
    if (saved) setSelectedTeamId(saved);
  }, []);

  // Persist team context
  useEffect(() => {
    if (selectedTeamId) {
      localStorage.setItem("eisenhower_teamId", selectedTeamId);
    } else {
      localStorage.removeItem("eisenhower_teamId");
    }
  }, [selectedTeamId]);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  const dateStr = selectedDate.toISOString().split("T")[0];

  // Fetch tasks from API when date changes
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const url = `/api/tasks?date=${dateStr}${selectedTeamId ? `&teamId=${selectedTeamId}` : ""}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        } else if (res.status === 403 && selectedTeamId) {
          // User no longer has access to this team
          setSelectedTeamId(null);
          toast.error("You no longer have access to that team");
        }
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      }
    };

    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/voice-notes?date=${dateStr}`);
        if (res.ok) {
          const data = await res.json();
          setVoiceNotes(data);
        }
      } catch (err) {
        console.error("Failed to fetch voice notes:", err);
      }
    };

    fetchTasks();
    fetchNotes();
  }, [dateStr, selectedTeamId]);

  const handleRecordingComplete = async (data: EisenhowerMatrixData, audioData: string, duration: string) => {
    // Build task list from AI analysis
    const taskBatch: { title: string; category: string; date: string; teamId?: string }[] = [];
    const addBatch = (titles: string[], category: TaskCategory) => {
      titles.forEach(title => {
        taskBatch.push({ title, category, date: dateStr, teamId: selectedTeamId || undefined });
      });
    };

    addBatch(data.urgentImportant, TaskCategory.URGENT_IMPORTANT);
    addBatch(data.importantNotUrgent, TaskCategory.IMPORTANT_NOT_URGENT);
    addBatch(data.urgentNotImportant, TaskCategory.URGENT_NOT_IMPORTANT);
    addBatch(data.notUrgentNotImportant, TaskCategory.NOT_URGENT_NOT_IMPORTANT);

    // Save tasks to DB
    if (taskBatch.length > 0) {
      try {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks: taskBatch }),
        });
      } catch (err) {
        console.error("Failed to save tasks:", err);
        toast.error("Failed to save tasks");
      }
    }

    // Save voice note to DB
    try {
      await fetch("/api/voice-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl: audioData,
          duration,
          date: dateStr,
        }),
      });
    } catch (err) {
      console.error("Failed to save voice note:", err);
    }

    // Refresh data from server
    const [tasksRes, notesRes] = await Promise.all([
      fetch(`/api/tasks?date=${dateStr}${selectedTeamId ? `&teamId=${selectedTeamId}` : ""}`),
      fetch(`/api/voice-notes?date=${dateStr}`),
    ]);

    if (tasksRes.ok) setTasks(await tasksRes.json());
    if (notesRes.ok) setVoiceNotes(await notesRes.json());
  };

  const toggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: newCompleted } : t));

    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: [{ id: taskId, completed: newCompleted }] }),
      });
    } catch {
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !newCompleted } : t));
    }
  }, [tasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });
    } catch {
      toast.error("Failed to delete task");
    }
  }, []);

  const handleTasksReorder = useCallback(async (updates: { id: string; category?: string; order: number }[]) => {
    // Optimistic update
    setTasks(prev => prev.map(t => {
      const u = updates.find(u => u.id === t.id);
      return u ? { ...t, ...(u.category && { category: u.category as TaskCategory }), order: u.order } : t;
    }));

    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updates }),
      });
    } catch {
      toast.error("Failed to update task order");
    }
  }, []);

  const deleteVoiceNote = useCallback(async (id: string) => {
    setVoiceNotes(prev => prev.filter(n => n.id !== id));
    try {
      await fetch("/api/voice-notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      toast.error("Failed to delete voice note");
    }
  }, []);

  const clearDay = async () => {
    const confirmMsg = selectedTeamId
      ? "Clear all team tasks for this date?"
      : null;
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    const dayTasks = mappedTasks.filter(t => t.date === dateStr);
    const dayNotes = mappedNotes.filter(n => n.date === dateStr);

    setTasks([]);
    setVoiceNotes([]);

    await Promise.all([
      ...dayTasks.map(t => fetch("/api/tasks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.id }) })),
      ...dayNotes.map(n => fetch("/api/voice-notes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) })),
    ]);

    toast.success("Day cleared");
  };

  // Resolve team name for task badges
  const activeTeamName = selectedTeamId
    ? teams.find(t => t.id === selectedTeamId)?.name
    : undefined;

  // Map date fields for display (API returns ISO strings, components expect YYYY-MM-DD)
  const mappedTasks = tasks.map(t => ({
    ...t,
    date: typeof t.date === "string" ? t.date.split("T")[0] : new Date(t.date).toISOString().split("T")[0],
  }));
  const mappedNotes = voiceNotes.map(n => ({
    ...n,
    date: typeof n.date === "string" ? n.date.split("T")[0] : new Date(n.date).toISOString().split("T")[0],
    audioData: n.audioUrl || n.audioData || "",
  }));

  return (
    <div>
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-indigo-200 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-none">Planner</h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Organizer</span>
          </div>
        </div>
        <TeamSelector
          teams={teams}
          selectedTeamId={selectedTeamId}
          onTeamChange={setSelectedTeamId}
          disabled={isProcessing}
        />
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Planning For</p>
          <p className="text-indigo-600 font-bold text-sm">{selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>

      <CalendarWheel
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <VoiceRecorder
          onRecordingComplete={handleRecordingComplete}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          provider={provider}
          onProviderChange={setProvider}
        />

        <VoiceNoteList
          voiceNotes={mappedNotes}
          onDeleteNote={deleteVoiceNote}
        />

        <div className="mt-4">
          <div className="flex items-center justify-between mb-8 px-4">
            <div className="flex items-baseline space-x-2">
              <h2 className="text-3xl font-black text-slate-900">Priority Grid</h2>
              <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
              <span className="text-slate-400 font-medium">{mappedTasks.length} tasks</span>
            </div>
            <button
              onClick={clearDay}
              className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center space-x-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear Day</span>
            </button>
          </div>

          {isProcessing ? (
            <MatrixSkeleton />
          ) : (
            <EisenhowerMatrix
              tasks={mappedTasks}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onTasksReorder={handleTasksReorder}
              teamName={activeTeamName}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
