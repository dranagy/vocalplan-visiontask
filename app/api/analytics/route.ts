import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskCategory } from "@prisma/client";
import { GoogleGenAI } from "@google/genai";

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Sunday start
  return d.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";
  const teamId = searchParams.get("teamId");

  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Verify team membership before allowing access to team analytics
  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
  }

  const baseWhere = {
    createdAt: { gte: startDate },
    ...(teamId ? { teamId } : { userId, teamId: null as string | null }),
  };

  const [totalTasks, completedTasks] = await Promise.all([
    prisma.task.count({ where: baseWhere }),
    prisma.task.count({ where: { ...baseWhere, completed: true } }),
  ]);

  const quadrantStats = await prisma.task.groupBy({
    by: ["category"],
    where: baseWhere,
    _count: { id: true },
  });

  const quadrantDistribution = Object.values(TaskCategory).map((cat) => ({
    category: cat,
    count: quadrantStats.find((s) => s.category === cat)?._count.id || 0,
  }));

  const overdueCount = await prisma.task.count({
    where: {
      ...baseWhere,
      deadline: { lt: new Date() },
      completed: false,
    },
  });

  // Aggregate daily stats using groupBy
  const byDate = await prisma.task.groupBy({
    by: ["date"],
    where: baseWhere,
    _count: { id: true },
  });

  const byDateCompleted = await prisma.task.groupBy({
    by: ["date"],
    where: { ...baseWhere, completed: true },
    _count: { id: true },
  });

  // Build a map for easy lookup
  const completedMap = new Map(
    byDateCompleted.map((d) => [new Date(d.date).toISOString().split("T")[0], d._count.id])
  );

  const dailyCompletions = byDate
    .map((d) => ({
      date: new Date(d.date).toISOString().split("T")[0],
      created: d._count.id,
      completed: completedMap.get(new Date(d.date).toISOString().split("T")[0]) || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // === Velocity data (last 4 weeks) ===
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const velocityWhere = {
    createdAt: { gte: fourWeeksAgo },
    ...(teamId ? { teamId } : { userId, teamId: null as string | null }),
  };

  const [allWeekTasks, allWeekCompleted] = await Promise.all([
    prisma.task.findMany({ where: velocityWhere, select: { createdAt: true } }),
    prisma.task.findMany({ where: { ...velocityWhere, completed: true }, select: { createdAt: true } }),
  ]);

  const weekCreatedMap = new Map<string, number>();
  const weekCompletedMap = new Map<string, number>();

  for (const t of allWeekTasks) {
    const wk = getWeekKey(t.createdAt);
    weekCreatedMap.set(wk, (weekCreatedMap.get(wk) || 0) + 1);
  }
  for (const t of allWeekCompleted) {
    const wk = getWeekKey(t.createdAt);
    weekCompletedMap.set(wk, (weekCompletedMap.get(wk) || 0) + 1);
  }

  // Build last 4 week slots
  const velocityData = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (3 - i) * 7);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const wk = weekStart.toISOString().split("T")[0];
    const created = weekCreatedMap.get(wk) || 0;
    const completed = weekCompletedMap.get(wk) || 0;
    return { week: wk, created, completed, velocity: created > 0 ? Math.round((completed / created) * 100) : 0 };
  });

  // === Burnout risk ===
  const lastWeek = velocityData[3];
  const prevWeek = velocityData[2];
  let burnoutRisk: { level: "low" | "medium" | "high"; reason: string } = { level: "low", reason: "Completion rate is healthy." };

  if (lastWeek && prevWeek) {
    const lastRate = lastWeek.created > 0 ? lastWeek.completed / lastWeek.created : 1;
    const prevRate = prevWeek.created > 0 ? prevWeek.completed / prevWeek.created : 1;
    const rateDrop = prevRate - lastRate;
    const volumeIncrease = lastWeek.created > prevWeek.created;

    if (rateDrop > 0.2 && volumeIncrease) {
      burnoutRisk = { level: "high", reason: `Completion rate dropped ${Math.round(rateDrop * 100)}% while task volume increased. Signs of overload.` };
    } else if (rateDrop > 0.1) {
      burnoutRisk = { level: "medium", reason: `Completion rate declined ${Math.round(rateDrop * 100)}% compared to last week.` };
    }
  }

  // === AI Insights ===
  let aiInsights: string[] = [];
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const insightPrompt = `You are a productivity analytics assistant. Based on the following task analytics data, provide exactly 3 concise, actionable bullet-point insights (each starting with "• ").

Data:
- Total tasks: ${totalTasks}
- Completed tasks: ${completedTasks}
- Completion rate: ${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
- Overdue tasks: ${overdueCount}
- Burnout risk: ${burnoutRisk.level} - ${burnoutRisk.reason}
- Weekly velocity trend: ${velocityData.map(w => `Week ${w.week}: ${w.created} created, ${w.completed} completed`).join("; ")}

Provide 3 bullet-point insights, each on its own line, starting with "• ".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts: [{ text: insightPrompt }] },
    });
    const text = response.text || "";
    aiInsights = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("•"))
      .map((line) => line.replace(/^•\s*/, ""))
      .slice(0, 3);
  } catch {
    aiInsights = ["Track your completion rate weekly to identify patterns.", "Focus on urgent-important tasks first.", "Review overdue tasks regularly."];
  }

  // === Team load data ===
  let teamLoadData: { assigneeId: string; count: number; completedCount: number }[] = [];
  if (teamId) {
    const assigneeGroups = await prisma.task.groupBy({
      by: ["assigneeId"],
      where: { teamId, createdAt: { gte: startDate }, assigneeId: { not: null } },
      _count: { id: true },
    });
    const assigneeGroupsCompleted = await prisma.task.groupBy({
      by: ["assigneeId"],
      where: { teamId, createdAt: { gte: startDate }, assigneeId: { not: null }, completed: true },
      _count: { id: true },
    });
    const completedByAssignee = new Map(
      assigneeGroupsCompleted.map((g) => [g.assigneeId, g._count.id])
    );
    teamLoadData = assigneeGroups
      .filter((g) => g.assigneeId !== null)
      .map((g) => ({
        assigneeId: g.assigneeId as string,
        count: g._count.id,
        completedCount: completedByAssignee.get(g.assigneeId) || 0,
      }));
  }

  return NextResponse.json({
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    quadrantDistribution,
    overdueCount,
    dailyCompletions,
    velocityData,
    burnoutRisk,
    aiInsights,
    teamLoadData,
  });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

