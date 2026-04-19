"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, TaskStatus, TaskSource } from "../../types";

interface KanbanTaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onUpdate: (task: Task) => void;
}

const statusColors: Record<string, string> = {
  [TaskStatus.TODO]: "bg-slate-100 text-slate-600",
  [TaskStatus.IN_PROGRESS]: "bg-blue-100 text-blue-700",
  [TaskStatus.REVIEW]: "bg-amber-100 text-amber-700",
  [TaskStatus.DONE]: "bg-emerald-100 text-emerald-700",
};

const statusLabels: Record<string, string> = {
  [TaskStatus.TODO]: "To Do",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.REVIEW]: "Review",
  [TaskStatus.DONE]: "Done",
};

function SourceIcon({ source }: { source: TaskSource }) {
  if (source === TaskSource.VOICE) {
    return (
      <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    );
  }
  if (source === TaskSource.IMAGE) {
    return (
      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

export default function KanbanTaskCard({ task, onDelete, onUpdate }: KanbanTaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
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

  const handleSave = () => {
    onUpdate(editedTask);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-3 rounded-xl border border-indigo-200 shadow-sm">
        <input
          className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg mb-2 border border-slate-200 outline-none focus:border-indigo-400 text-sm"
          value={editedTask.title}
          onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
          placeholder="Task title"
        />
        <textarea
          className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg mb-2 border border-slate-200 outline-none focus:border-indigo-400 h-16 text-xs"
          value={editedTask.description}
          onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
          placeholder="Description"
        />
        <input
          className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg mb-3 border border-slate-200 outline-none focus:border-indigo-400 text-sm"
          value={editedTask.deadline || ""}
          onChange={(e) => setEditedTask({ ...editedTask, deadline: e.target.value })}
          placeholder="Deadline (e.g. 2024-12-31)"
        />
        <div className="flex gap-2">
          <button onClick={handleSave} className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors">Save</button>
          <button onClick={() => setIsEditing(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-xs font-medium transition-colors">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all"
    >
      <div className="flex justify-between items-start mb-1.5">
        <div className="flex-grow min-w-0 mr-2" {...attributes} {...listeners}>
          <h4 className="font-semibold text-slate-800 text-sm leading-tight">{task.title}</h4>
        </div>
        <div className="flex gap-1 shrink-0">
          <SourceIcon source={task.source} />
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 hover:text-indigo-500 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 hover:text-red-500 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      {task.description && (
        <p className="text-slate-400 text-xs mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusColors[task.status] || statusColors[TaskStatus.TODO]}`}>
          {statusLabels[task.status] || "To Do"}
        </span>
        {task.deadline && (
          <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {task.deadline.split("T")[0]}
          </span>
        )}
      </div>
    </div>
  );
}
