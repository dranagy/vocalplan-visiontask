import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskCategory } from "@prisma/client";

const VALID_CATEGORIES = new Set(Object.values(TaskCategory));

function isValidCategory(value: string): value is TaskCategory {
  return VALID_CATEGORIES.has(value as TaskCategory);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const teamId = searchParams.get("teamId");

  if (!date) {
    return NextResponse.json({ error: "date query param is required" }, { status: 400 });
  }

  const where: Record<string, unknown> = { date: new Date(date) };

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
    where.teamId = teamId;
  } else {
    where.userId = userId;
    where.teamId = null;
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });

  return NextResponse.json(tasks);
  } catch (error) {
    console.error("Tasks GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
  const body = await request.json();
  const { tasks, ...singleTask } = body;

  // Batch create (from AI analysis)
  if (tasks && Array.isArray(tasks)) {
    const invalidCategory = tasks.find((t: { category: string }) => !isValidCategory(t.category));
    if (invalidCategory) {
      return NextResponse.json({ error: `Invalid task category: ${invalidCategory.category}` }, { status: 400 });
    }

    // Verify membership for all unique team IDs
    const teamIds = [...new Set(
      tasks
        .map((t: { teamId?: string }) => t.teamId)
        .filter((id: string | undefined): id is string => !!id)
    )];
    for (const tid of teamIds) {
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: tid, userId } },
      });
      if (!membership) {
        return NextResponse.json({ error: "Not a team member" }, { status: 403 });
      }
    }

    const created = await prisma.task.createMany({
      data: tasks.map((t: { title: string; category: string; date: string; deadline?: string; teamId?: string }) => ({
        title: t.title,
        category: t.category as TaskCategory,
        date: new Date(t.date),
        deadline: t.deadline ? new Date(t.deadline) : null,
        userId,
        teamId: t.teamId || null,
      })),
    });
    return NextResponse.json({ count: created.count }, { status: 201 });
  }

  // Single task create
  const { title, category, date, deadline, teamId } = singleTask;
  if (!title || !category || !date) {
    return NextResponse.json({ error: "title, category, and date are required" }, { status: 400 });
  }

  if (!isValidCategory(category)) {
    return NextResponse.json({ error: `Invalid task category: ${category}` }, { status: 400 });
  }

  // Verify team membership before creating a team task
  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      category: category as TaskCategory,
      date: new Date(date),
      deadline: deadline ? new Date(deadline) : null,
      userId,
      teamId: teamId || null,
    },
  });

  return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Tasks POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
  const { tasks: updates } = await request.json();

  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: "tasks array is required" }, { status: 400 });
  }

  // Validate categories upfront
  for (const u of updates) {
    if (u.category && !isValidCategory(u.category)) {
      return NextResponse.json({ error: `Invalid task category: ${u.category}` }, { status: 400 });
    }
  }

  const results = await Promise.all(
    updates.map(async (u: {
      id: string; category?: string; order?: number;
      completed?: boolean; deadline?: string | null;
      teamId?: string | null;
    }) => {
      const existing = await prisma.task.findUnique({ where: { id: u.id } });
      if (!existing) return null;

      // Authorization: team task → check membership; personal task → check ownership
      if (existing.teamId) {
        const membership = await prisma.teamMember.findUnique({
          where: { teamId_userId: { teamId: existing.teamId, userId } },
        });
        if (!membership) return null;
      } else if (existing.userId !== userId) {
        return null;
      }

      // If assigning to a new team, verify membership in target team
      if (u.teamId) {
        const membership = await prisma.teamMember.findUnique({
          where: { teamId_userId: { teamId: u.teamId, userId } },
        });
        if (!membership) return null;
      }

      return prisma.task.update({
        where: { id: u.id },
        data: {
          ...(u.category && { category: u.category as TaskCategory }),
          ...(u.order !== undefined && { order: u.order }),
          ...(u.completed !== undefined && { completed: u.completed }),
          ...(u.deadline !== undefined && { deadline: u.deadline ? new Date(u.deadline) : null }),
          ...(u.teamId !== undefined && { teamId: u.teamId }),
        },
      });
    })
  );

  return NextResponse.json({ updated: results.filter(Boolean).length });
  } catch (error) {
    console.error("Tasks PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Authorization: team task → check membership; personal task → check ownership
  if (existing.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: existing.teamId, userId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
  } else if (existing.userId !== userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tasks DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
