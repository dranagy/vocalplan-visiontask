"use client";

import React, { useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Task } from "../../types";
import KanbanTaskCard from "./KanbanTaskCard";

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onAddTask: (assigneeId: string) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onDeleteColumn?: (id: string) => void;
  onRenameColumn?: (id: string, name: string) => void;
}

export default function KanbanColumn({
  id,
  title,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onDeleteColumn,
  onRenameColumn,
}: KanbanColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const { setNodeRef, isOver } = useDroppable({ id });

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== title) {
      onRenameColumn?.(id, editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 md:w-80 bg-slate-50 border rounded-2xl flex flex-col max-h-[70vh] transition-colors ${
        isOver ? "border-indigo-300 bg-indigo-50/50" : "border-slate-200"
      }`}
    >
      {/* Column header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-grow mr-2">
            {isEditing ? (
              <input
                autoFocus
                className="bg-white text-slate-900 px-2 py-1 rounded-lg w-full border border-indigo-300 outline-none text-sm font-bold"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
              />
            ) : (
              <>
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm truncate">
                  {title}
                </h3>
                <span className="bg-white text-slate-500 text-xs px-2 py-0.5 rounded-full font-mono border border-slate-200">
                  {tasks.length}
                </span>
              </>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-slate-300 hover:text-indigo-500 transition-colors"
              title="Rename column"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            {onDeleteColumn && id !== "unassigned" && (
              <button
                onClick={() => onDeleteColumn(id)}
                className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                title="Delete column"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="p-3 overflow-y-auto flex-grow space-y-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 opacity-30 select-none">
              <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-xs text-slate-500">No tasks</p>
            </div>
          ) : (
            tasks.map((task) => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                onDelete={onDeleteTask}
                onUpdate={onUpdateTask}
              />
            ))
          )}
        </SortableContext>
      </div>

      {/* Add task button */}
      <div className="p-3 pt-0">
        <button
          onClick={() => onAddTask(id)}
          className="w-full p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-slate-400 hover:text-indigo-600 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Task
        </button>
      </div>
    </div>
  );
}
