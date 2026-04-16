"use client";

import React from 'react';

interface CalendarWheelProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const CalendarWheel: React.FC<CalendarWheelProps> = ({ selectedDate, onDateChange }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const todayRef = React.useRef<HTMLButtonElement>(null);
  const todayStr = new Date().toDateString();

  const dates = React.useMemo(() => {
    const today = new Date();
    const result = [];
    // Show 30 past days + today + 29 future days (60 total)
    for (let i = -30; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      result.push(date);
    }
    return result;
  }, []);

  // Auto-scroll to today on mount
  React.useEffect(() => {
    if (todayRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const todayBtn = todayRef.current;
      container.scrollLeft = todayBtn.offsetLeft - container.clientWidth / 2 + todayBtn.clientWidth / 2;
    }
  }, []);

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const isToday = (date: Date) => {
    return date.toDateString() === todayStr;
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div ref={scrollRef} className="w-full overflow-x-auto no-scrollbar bg-white shadow-sm border-b py-4 sticky top-0 z-10">
      <div className="flex space-x-4 px-4 min-w-max">
        {dates.map((date) => {
          const past = isPast(date);
          const today = isToday(date);
          const selected = isSelected(date);

          return (
            <button
              key={date.toISOString()}
              ref={today ? todayRef : undefined}
              onClick={() => onDateChange(date)}
              className={`flex flex-col items-center justify-center min-w-[64px] md:min-w-[80px] p-2 md:p-3 rounded-2xl transition-all ${
                selected
                  ? 'bg-indigo-600 text-white shadow-lg scale-105'
                  : today
                    ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 ring-2 ring-indigo-300'
                    : past
                      ? 'bg-slate-50/50 text-slate-400 hover:bg-slate-100'
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
              {today && !selected && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarWheel;
