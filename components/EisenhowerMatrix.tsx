"use client";

import React, { useCallback } from "react";
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
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task, TaskCategory } from "../types";
import SortableTask from "./SortableTask";

interface EisenhowerMatrixProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onTasksReorder?: (updates: { id: string; category?: string; order: number }[]) => void;
  teamName?: string;
}

const quadrants = [
  {
    title: "Do First",
    subtitle: "Urgent & Important",
    category: TaskCategory.URGENT_IMPORTANT,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconColor: "text-red-500",
    textColor: "text-red-900",
  },
  {
    title: "Schedule",
    subtitle: "Important, Not Urgent",
    category: TaskCategory.IMPORTANT_NOT_URGENT,
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    iconColor: "text-indigo-500",
    textColor: "text-indigo-900",
  },
  {
    title: "Delegate",
    subtitle: "Urgent, Not Important",
    category: TaskCategory.URGENT_NOT_IMPORTANT,
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    iconColor: "text-orange-500",
    textColor: "text-orange-900",
  },
  {
    title: "Eliminate",
    subtitle: "Neither",
    category: TaskCategory.NOT_URGENT_NOT_IMPORTANT,
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    iconColor: "text-slate-500",
    textColor: "text-slate-900",
  },
];

const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  onToggleTask,
  onDeleteTask,
  onTasksReorder,
  teamName,
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || !onTasksReorder) return;

      const activeTask = tasks.find((t) => t.id === active.id);
      if (!activeTask) return;

      // Determine destination quadrant from over container or over task
      const overId = over.id as string;

      // Check if dropped on a quadrant container or another task
      let destCategory: string | null = null;
      let destOrder = 0;

      // Find which quadrant the over item belongs to
      for (const q of quadrants) {
        const qTasks = tasks.filter((t) => t.category === q.category);
        if (qTasks.some((t) => t.id === overId) || overId === q.category) {
          destCategory = q.category;
          destOrder = qTasks.length;
          break;
        }
      }

      if (!destCategory) return;

      const updates: { id: string; category?: string; order: number }[] = [];

      if (activeTask.category !== destCategory) {
        // Moving to a different quadrant
        updates.push({ id: activeTask.id, category: destCategory, order: destOrder });
      } else {
        // Reordering within the same quadrant
        const qTasks = tasks
          .filter((t) => t.category === destCategory && t.id !== activeTask.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        const overIndex = qTasks.findIndex((t) => t.id === overId);
        if (overIndex === -1) return;

        qTasks.splice(overIndex, 0, activeTask);
        qTasks.forEach((t, i) => {
          updates.push({ id: t.id, order: i });
        });
      }

      if (updates.length > 0) {
        onTasksReorder(updates);
      }
    },
    [tasks, onTasksReorder]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-w-6xl mx-auto w-full">
        {quadrants.map((q) => {
          const quadrantTasks = tasks
            .filter((t) => t.category === q.category)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          return (
            <div
              key={q.category}
              id={q.category}
              className={`${q.bgColor} border ${q.borderColor} rounded-3xl p-6 flex flex-col min-h-[300px] shadow-sm transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-xl font-bold ${q.textColor}`}>{q.title}</h3>
                  <p className="text-xs font-medium opacity-60 uppercase tracking-wider">{q.subtitle}</p>
                </div>
                <div className={q.iconColor}>
                  <span className="text-sm font-bold bg-white px-2 py-1 rounded-lg border shadow-sm">
                    {quadrantTasks.length}
                  </span>
                </div>
              </div>

              <SortableContext
                items={quadrantTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex-grow space-y-2">
                  {quadrantTasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                      <span className="text-slate-400 text-sm">No tasks here</span>
                    </div>
                  ) : (
                    quadrantTasks.map((task) => (
                      <SortableTask
                        key={task.id}
                        task={task}
                        onToggle={onToggleTask}
                        onDelete={onDeleteTask}
                        teamName={teamName}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="bg-white p-3 rounded-xl border shadow-lg opacity-80 max-w-sm">
            <span className="text-sm text-slate-700">
              {tasks.find((t) => t.id === activeId)?.title}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default EisenhowerMatrix;
