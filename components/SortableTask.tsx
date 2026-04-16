"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../types";

interface SortableTaskProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  teamName?: string;
}

export default function SortableTask({ task, onToggle, onDelete, teamName }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date();
  const isDueToday = task.deadline && new Date(task.deadline).toDateString() === new Date().toDateString();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start space-x-3 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-white shadow-sm hover:border-slate-200 transition-all"
    >
      <button
        onClick={() => onToggle(task.id)}
        className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
          task.completed
            ? "bg-indigo-500 border-indigo-500"
            : "border-slate-300 hover:border-indigo-400"
        }`}
      >
        {task.completed && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-grow min-w-0" {...attributes} {...listeners}>
        <span className={`text-sm leading-tight block ${task.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
          {task.title}
          {teamName && (
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 rounded">
              {teamName}
            </span>
          )}
        </span>
        {task.deadline && (
          <span className={`text-xs font-medium mt-1 block ${
            isOverdue ? "text-red-500" : isDueToday ? "text-amber-500" : "text-slate-400"
          }`}>
            {isOverdue ? "Overdue: " : isDueToday ? "Due today: " : ""}
            {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400 transition-all shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
