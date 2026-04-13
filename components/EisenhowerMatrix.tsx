"use client";

import React from 'react';
import { Task, TaskCategory } from '../types';

interface EisenhowerMatrixProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({ tasks, onToggleTask, onDeleteTask }) => {
  const quadrants = [
    {
      title: 'Do First',
      subtitle: 'Urgent & Important',
      category: TaskCategory.URGENT_IMPORTANT,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-500',
      textColor: 'text-red-900',
    },
    {
      title: 'Schedule',
      subtitle: 'Important, Not Urgent',
      category: TaskCategory.IMPORTANT_NOT_URGENT,
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      iconColor: 'text-indigo-500',
      textColor: 'text-indigo-900',
    },
    {
      title: 'Delegate',
      subtitle: 'Urgent, Not Important',
      category: TaskCategory.URGENT_NOT_IMPORTANT,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-500',
      textColor: 'text-orange-900',
    },
    {
      title: 'Eliminate',
      subtitle: 'Neither',
      category: TaskCategory.NOT_URGENT_NOT_IMPORTANT,
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      iconColor: 'text-slate-500',
      textColor: 'text-slate-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-w-6xl mx-auto w-full">
      {quadrants.map((q) => {
        const quadrantTasks = tasks.filter(t => t.category === q.category);
        return (
          <div key={q.category} className={`${q.bgColor} border ${q.borderColor} rounded-3xl p-6 flex flex-col min-h-[300px] shadow-sm transition-all hover:shadow-md`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-xl font-bold ${q.textColor}`}>{q.title}</h3>
                <p className="text-xs font-medium opacity-60 uppercase tracking-wider">{q.subtitle}</p>
              </div>
              <div className={`${q.iconColor}`}>
                <span className="text-sm font-bold bg-white px-2 py-1 rounded-lg border shadow-sm">
                  {quadrantTasks.length}
                </span>
              </div>
            </div>

            <div className="flex-grow space-y-2">
              {quadrantTasks.length === 0 ? (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                  <span className="text-slate-400 text-sm">No tasks here</span>
                </div>
              ) : (
                quadrantTasks.map((task) => (
                  <div key={task.id} className="group flex items-start space-x-3 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-white shadow-sm hover:border-slate-200 transition-all">
                    <button 
                      onClick={() => onToggleTask(task.id)}
                      className="mt-1 w-5 h-5 rounded-md border-2 border-slate-300 flex items-center justify-center hover:border-indigo-400 transition-colors"
                    >
                      <div className="w-2.5 h-2.5 bg-indigo-500 rounded-sm opacity-0 group-hover:opacity-20"></div>
                    </button>
                    <span className="flex-grow text-slate-700 text-sm leading-tight">{task.title}</span>
                    <button 
                      onClick={() => onDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EisenhowerMatrix;
