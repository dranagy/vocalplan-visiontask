import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskCategory } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";
  const teamId = searchParams.get("teamId");

  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

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

  return NextResponse.json({
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    quadrantDistribution,
    overdueCount,
    dailyCompletions,
  });
}
