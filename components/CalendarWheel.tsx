"use client";

import React from 'react';

interface CalendarWheelProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const CalendarWheel: React.FC<CalendarWheelProps> = ({ selectedDate, onDateChange }) => {
  const dates = React.useMemo(() => {
    const today = new Date();
    const result = [];
    // Show 30 days starting from today
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      result.push(date);
    }
    return result;
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar bg-white shadow-sm border-b py-4 sticky top-0 z-10">
      <div className="flex space-x-4 px-4 min-w-max">
        {dates.map((date) => (
          <button
            key={date.toISOString()}
            onClick={() => onDateChange(date)}
            className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-2xl transition-all ${
              isSelected(date)
                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs font-semibold uppercase opacity-80">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </span>
            <span className="text-xl font-bold">
              {date.getDate()}
            </span>
            <span className="text-[10px] font-medium opacity-80 uppercase">
              {date.toLocaleDateString('en-US', { month: 'short' })}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalendarWheel;
