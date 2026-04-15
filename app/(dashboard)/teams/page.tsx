"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Team, TeamMember } from "@/types";

export default function TeamsPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) setTeams(await res.json());
    } catch {
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName }),
      });
      if (res.ok) {
        toast.success("Team created!");
        setTeamName("");
        setShowCreate(false);
        fetchTeams();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to create team");
    }
  };

  const joinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      if (res.ok) {
        toast.success("Joined team!");
        setInviteCode("");
        setShowJoin(false);
        fetchTeams();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to join team");
    }
  };

  const fetchMembers = async (teamId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`);
      if (res.ok) setMembers(await res.json());
    } catch {
      toast.error("Failed to load members");
    }
  };

  const loadMembers = async (teamId: string) => {
    if (expandedTeam === teamId) {
      setExpandedTeam(null);
      return;
    }
    await fetchMembers(teamId);
    setExpandedTeam(teamId);
  };

  const removeMember = async (teamId: string, userId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        toast.success("Member removed");
        await fetchMembers(teamId);
        fetchTeams();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to remove member");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-slate-900">Teams</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Create Team
          </button>
          <button
            onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Join Team
          </button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={createTeam} className="bg-white rounded-2xl border p-6 mb-6 space-y-4">
          <h3 className="font-bold text-slate-900">Create a new team</h3>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team name"
            required
            minLength={2}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
          />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Create</button>
          </div>
        </form>
      )}

      {showJoin && (
        <form onSubmit={joinTeam} className="bg-white rounded-2xl border p-6 mb-6 space-y-4">
          <h3 className="font-bold text-slate-900">Join a team</h3>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Enter invite code (e.g. ABCD1234)"
            required
            maxLength={8}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm tracking-widest uppercase"
          />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setShowJoin(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Join</button>
          </div>
        </form>
      )}

      {teams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border">
          <p className="text-slate-500 mb-2">You&apos;re not in any teams yet.</p>
          <p className="text-slate-400 text-sm">Create a team or join one with an invite code.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => {
            const isOwner = team.members?.some(
              (m) => m.role === "OWNER" && m.user?.id === currentUserId
            );
            return (
              <div key={team.id} className="bg-white rounded-2xl border overflow-hidden">
                <div
                  className="p-6 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between"
                  onClick={() => loadMembers(team.id)}
                >
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{team.name}</h3>
                    <p className="text-sm text-slate-500">
                      {team._count?.members || 0} members &bull; {team._count?.tasks || 0} tasks
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
                      <span className="text-xs font-mono font-bold text-slate-600 tracking-wider">{team.inviteCode}</span>
                    </div>
                    <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedTeam === team.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {expandedTeam === team.id && (
                  <div className="border-t px-6 py-4 bg-slate-50">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Members</h4>
                    <div className="space-y-2">
                      {members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold">
                              {(m.user?.name || m.user?.email || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{m.user?.name || m.user?.email}</p>
                              <p className="text-xs text-slate-400">{m.role}</p>
                            </div>
                          </div>
                          {isOwner && m.role !== "OWNER" && (
                            <button
                              onClick={() => removeMember(team.id, m.userId)}
                              className="text-xs text-red-400 hover:text-red-600 font-semibold"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
