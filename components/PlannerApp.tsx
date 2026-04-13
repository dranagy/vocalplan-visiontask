"use client";

import React, { useState, useEffect, useCallback } from "react";
import CalendarWheel from "./CalendarWheel";
import VoiceRecorder from "./VoiceRecorder";
import EisenhowerMatrix from "./EisenhowerMatrix";
import VoiceNoteList from "./VoiceNoteList";
import { Task, TaskCategory, EisenhowerMatrixData, VoiceNote } from "../types";

export type AIProvider = "gemini" | "glm";

const App: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [provider, setProvider] = useState<AIProvider>("gemini");

  // Load from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("eisenhower_tasks_v2");
    const savedNotes = localStorage.getItem("eisenhower_notes_v2");
    const savedProvider = localStorage.getItem("eisenhower_provider");
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
    }
    if (savedNotes) {
      try {
        setVoiceNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Failed to load notes", e);
      }
    }
    if (savedProvider === "gemini" || savedProvider === "glm") {
      setProvider(savedProvider);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem("eisenhower_tasks_v2", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("eisenhower_notes_v2", JSON.stringify(voiceNotes));
  }, [voiceNotes]);

  useEffect(() => {
    localStorage.setItem("eisenhower_provider", provider);
  }, [provider]);

  const handleRecordingComplete = (data: EisenhowerMatrixData, audioData: string, duration: string) => {
    const dateStr = selectedDate.toISOString().split("T")[0];

    // 1. Save tasks
    const newTasks: Task[] = [];
    const addBatch = (titles: string[], category: TaskCategory) => {
      titles.forEach(title => {
        newTasks.push({
          id: Math.random().toString(36).substr(2, 9),
          title,
          category,
          date: dateStr
        });
      });
    };

    addBatch(data.urgentImportant, TaskCategory.URGENT_IMPORTANT);
    addBatch(data.importantNotUrgent, TaskCategory.IMPORTANT_NOT_URGENT);
    addBatch(data.urgentNotImportant, TaskCategory.URGENT_NOT_IMPORTANT);
    addBatch(data.notUrgentNotImportant, TaskCategory.NOT_URGENT_NOT_IMPORTANT);

    setTasks(prev => [...prev, ...newTasks]);

    // 2. Save voice note
    const newNote: VoiceNote = {
      id: Math.random().toString(36).substr(2, 9),
      audioData,
      date: dateStr,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      duration
    };
    setVoiceNotes(prev => [...prev, newNote]);
  };

  const toggleTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const deleteVoiceNote = useCallback((id: string) => {
    setVoiceNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const dateStr = selectedDate.toISOString().split("T")[0];
  const filteredTasks = tasks.filter(t => t.date === dateStr);
  const filteredNotes = voiceNotes.filter(n => n.date === dateStr);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-white/90">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-indigo-200 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-none">VocalPlan</h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Organizer</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Planning For</p>
          <p className="text-indigo-600 font-bold text-sm">{selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </header>

      <CalendarWheel
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <main className="flex-grow bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            provider={provider}
            onProviderChange={setProvider}
          />

          <VoiceNoteList
            voiceNotes={filteredNotes}
            onDeleteNote={deleteVoiceNote}
          />

          <div className="mt-4">
            <div className="flex items-center justify-between mb-8 px-4">
              <div className="flex items-baseline space-x-2">
                <h2 className="text-3xl font-black text-slate-900">Priority Grid</h2>
                <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                <span className="text-slate-400 font-medium">{filteredTasks.length} tasks</span>
              </div>
              <button
                onClick={() => {
                  setTasks(prev => prev.filter(t => t.date !== dateStr));
                  setVoiceNotes(prev => prev.filter(n => n.date !== dateStr));
                }}
                className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center space-x-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear Day</span>
              </button>
            </div>

            <EisenhowerMatrix
              tasks={filteredTasks}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
            />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t py-12 px-6 text-center text-slate-400 text-sm">
        <p className="font-medium tracking-tight">VocalPlan &bull; Organize with the speed of sound</p>
        <p className="mt-1 text-xs opacity-50 uppercase tracking-widest font-bold">Powered by Gemini AI & Z.AI</p>
      </footer>
    </div>
  );
};

export default App;
