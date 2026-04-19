import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskCategory, TaskStatus, TaskSource } from "@prisma/client";

const VALID_CATEGORIES = new Set(Object.values(TaskCategory));
const VALID_STATUSES = new Set(Object.values(TaskStatus));
const VALID_SOURCES = new Set(Object.values(TaskSource));

function isValidCategory(value: string): value is TaskCategory {
  return VALID_CATEGORIES.has(value as TaskCategory);
}

function isValidStatus(value: string): value is TaskStatus {
  return VALID_STATUSES.has(value as TaskStatus);
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
  const status = searchParams.get("status");
  const assigneeId = searchParams.get("assigneeId");

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

  if (status) where.status = status;
  if (assigneeId) where.assigneeId = assigneeId;

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
      data: tasks.map((t: {
        title: string; category: string; date: string; deadline?: string;
        teamId?: string; description?: string; status?: string; source?: string;
        assigneeId?: string;
      }) => ({
        title: t.title,
        description: t.description || "",
        category: t.category as TaskCategory,
        status: (t.status && isValidStatus(t.status) ? t.status : "TODO") as TaskStatus,
        source: (t.source && VALID_SOURCES.has(t.source as TaskSource) ? t.source : "MANUAL") as TaskSource,
        assigneeId: t.assigneeId || null,
        date: new Date(t.date),
        deadline: t.deadline ? new Date(t.deadline) : null,
        userId,
        teamId: t.teamId || null,
      })),
    });
    return NextResponse.json({ count: created.count }, { status: 201 });
  }

  // Single task create
  const { title, category, date, deadline, teamId, description, status, source, assigneeId } = singleTask;
  if (!title || !date) {
    return NextResponse.json({ error: "title and date are required" }, { status: 400 });
  }

  const taskCategory = category && isValidCategory(category) ? category : "URGENT_IMPORTANT";
  const taskStatus = status && isValidStatus(status) ? status : "TODO";

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
      description: description || "",
      category: taskCategory as TaskCategory,
      status: taskStatus as TaskStatus,
      source: (source && VALID_SOURCES.has(source as TaskSource) ? source : "MANUAL") as TaskSource,
      assigneeId: assigneeId || null,
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

  // Validate categories and statuses upfront
  for (const u of updates) {
    if (u.category && !isValidCategory(u.category)) {
      return NextResponse.json({ error: `Invalid task category: ${u.category}` }, { status: 400 });
    }
    if (u.status && !isValidStatus(u.status)) {
      return NextResponse.json({ error: `Invalid task status: ${u.status}` }, { status: 400 });
    }
  }

  const results = await Promise.all(
    updates.map(async (u: {
      id: string; category?: string; order?: number;
      completed?: boolean; deadline?: string | null;
      teamId?: string | null; status?: string;
      assigneeId?: string | null; description?: string;
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
          ...(u.status && { status: u.status as TaskStatus }),
          ...(u.assigneeId !== undefined && { assigneeId: u.assigneeId }),
          ...(u.description !== undefined && { description: u.description }),
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
