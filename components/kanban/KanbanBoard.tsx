"use client";

import React, { useCallback, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { Task, TaskSource } from "../../types";
import KanbanColumn from "./KanbanColumn";
import KanbanTaskCard from "./KanbanTaskCard";
import toast from "react-hot-toast";

interface KanbanBoardProps {
  tasks: Task[];
  onTasksUpdate: (updates: { id: string; assigneeId?: string | null; status?: string; order?: number }[]) => void;
  onTaskCreate: (title: string, assigneeId: string) => void;
  onTaskDelete: (id: string) => void;
  onTaskUpdate: (task: Task) => void;
}

export default function KanbanBoard({
  tasks,
  onTasksUpdate,
  onTaskCreate,
  onTaskDelete,
  onTaskUpdate,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [showNewColumn, setShowNewColumn] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Group tasks by assigneeId
  const columns = React.useMemo(() => {
    const colMap = new Map<string, Task[]>();
    tasks.forEach((t) => {
      const key = t.assigneeId || "unassigned";
      if (!colMap.has(key)) colMap.set(key, []);
      colMap.get(key)!.push(t);
    });
    return colMap;
  }, [tasks]);

  const columnOrder = React.useMemo(() => {
    const order: string[] = [];
    const seen = new Set<string>();
    // Maintain insertion order from tasks
    tasks.forEach((t) => {
      const key = t.assigneeId || "unassigned";
      if (!seen.has(key)) {
        seen.add(key);
        order.push(key);
      }
    });
    // Ensure unassigned is always present
    if (!seen.has("unassigned")) {
      order.push("unassigned");
    }
    return order;
  }, [tasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const activeTask = tasks.find((t) => t.id === active.id);
      if (!activeTask) return;

      const overId = over.id as string;

      // Find destination column
      let destAssigneeId: string | null = null;

      // Check if dropped on a column
      if (columnOrder.includes(overId)) {
        destAssigneeId = overId === "unassigned" ? null : overId;
      } else {
        // Dropped on a task — find which column that task is in
        const overTask = tasks.find((t) => t.id === overId);
        if (overTask) {
          destAssigneeId = overTask.assigneeId || null;
        }
      }

      if (destAssigneeId === undefined) return;

      const currentAssignee = activeTask.assigneeId || null;
      if (currentAssignee !== destAssigneeId) {
        onTasksUpdate([{ id: activeTask.id, assigneeId: destAssigneeId }]);
      }
    },
    [tasks, columnOrder, onTasksUpdate]
  );

  const handleAddTask = (assigneeId: string) => {
    const title = prompt("Task title:");
    if (title?.trim()) {
      onTaskCreate(title.trim(), assigneeId);
    }
  };

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      // Create a placeholder task in the new column
      onTaskCreate(`Welcome to ${newColumnName.trim()}`, newColumnName.trim());
      setNewColumnName("");
      setShowNewColumn(false);
    }
  };

  const handleUpdateTask = useCallback(
    async (updatedTask: Task) => {
      try {
        const res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasks: [{
              id: updatedTask.id,
              description: updatedTask.description,
              deadline: updatedTask.deadline,
            }],
          }),
        });
        if (res.ok) {
          onTaskUpdate(updatedTask);
        }
      } catch {
        toast.error("Failed to update task");
      }
    },
    [onTaskUpdate]
  );

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 px-1">
          {columnOrder.map((colId) => {
            const colTasks = columns.get(colId) || [];
            const colTitle = colId === "unassigned" ? "Unassigned" : colId;

            return (
              <KanbanColumn
                key={colId}
                id={colId}
                title={colTitle}
                tasks={colTasks}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={onTaskDelete}
                onRenameColumn={(id, name) => {
                  const colTasks = columns.get(id) || [];
                  if (colTasks.length > 0) {
                    onTasksUpdate(colTasks.map((t) => ({ id: t.id, assigneeId: name })));
                  }
                }}
              />
            );
          })}

          {/* Add new column */}
          {showNewColumn ? (
            <div className="flex-shrink-0 w-72 md:w-80 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <input
                autoFocus
                className="w-full bg-white text-slate-900 px-3 py-2 rounded-lg border border-indigo-300 outline-none text-sm font-bold mb-3"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Column name..."
                onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
              />
              <div className="flex gap-2">
                <button onClick={handleAddColumn} className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">Add</button>
                <button onClick={() => { setShowNewColumn(false); setNewColumnName(""); }} className="text-slate-400 hover:text-slate-600 px-3 py-1.5 text-xs font-medium transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewColumn(true)}
              className="flex-shrink-0 w-16 bg-white/50 hover:bg-indigo-50 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl flex items-center justify-center transition-all group"
            >
              <svg className="w-6 h-6 text-slate-300 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
              </svg>
            </button>
          )}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="bg-white p-3 rounded-xl border shadow-lg max-w-xs opacity-90">
              <span className="text-sm font-medium text-slate-700">{activeTask.title}</span>
              {activeTask.description && (
                <p className="text-xs text-slate-400 mt-1">{activeTask.description}</p>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
