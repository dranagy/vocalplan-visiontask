"use client";

import React from "react";
import { Team } from "../types";

interface TeamSelectorProps {
  teams: Team[];
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
  disabled?: boolean;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  teams,
  selectedTeamId,
  onTeamChange,
  disabled = false,
}) => {
  return (
    <div className="bg-slate-100 p-1 rounded-full flex items-center gap-0.5">
      {/* Personal option */}
      <button
        onClick={() => onTeamChange(null)}
        disabled={disabled}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
          selectedTeamId === null
            ? "bg-white text-indigo-600 shadow-sm"
            : "text-slate-400 hover:text-slate-600"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        Personal
      </button>

      {/* Team options */}
      {teams.map((team) => (
        <button
          key={team.id}
          onClick={() => onTeamChange(team.id)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
            selectedTeamId === team.id
              ? "bg-white text-emerald-600 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {/* Users icon */}
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="max-w-[80px] truncate">{team.name}</span>
        </button>
      ))}

      {/* When no teams joined yet, show a link to create/join one */}
      {teams.length === 0 && (
        <a
          href="/teams"
          title="Go to Teams to create or join a team"
          className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-400 hover:text-indigo-500 transition-all"
        >
          + Team
        </a>
      )}
    </div>
  );
};

export default TeamSelector;
