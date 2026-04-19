"use client";

import { OnlineUser } from "@/lib/hooks/useRealtimeSync";

function getAvatarColor(userId: string): string {
  const colors = [
    "bg-rose-400",
    "bg-orange-400",
    "bg-amber-400",
    "bg-emerald-400",
    "bg-teal-400",
    "bg-cyan-400",
    "bg-sky-400",
    "bg-violet-400",
    "bg-pink-400",
    "bg-indigo-400",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) & 0xffffffff;
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  if (!name || name.trim().length === 0) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

interface PresenceAvatarsProps {
  users: OnlineUser[];
  maxVisible?: number;
}

export default function PresenceAvatars({ users, maxVisible = 4 }: PresenceAvatarsProps) {
  if (users.length === 0) return null;

  const visible = users.slice(0, maxVisible);
  const overflow = users.length - maxVisible;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((user) => (
        <div key={user.userId} className="relative group">
          <div
            className={`w-7 h-7 rounded-full ${getAvatarColor(user.userId)} flex items-center justify-center border-2 border-white text-white text-[10px] font-bold shadow-sm cursor-default`}
          >
            {getInitials(user.userName)}
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50">
            <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap">
              {user.userName}
            </div>
          </div>
        </div>
      ))}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white text-slate-600 text-[10px] font-bold shadow-sm">
          +{overflow}
        </div>
      )}
    </div>
  );
}
