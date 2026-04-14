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
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const { tasks, ...singleTask } = body;

  // Batch create (from AI analysis)
  if (tasks && Array.isArray(tasks)) {
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
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { tasks: updates } = await request.json();

  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: "tasks array is required" }, { status: 400 });
  }

  const results = await Promise.all(
    updates.map((u: { id: string; category?: string; order?: number; completed?: boolean; deadline?: string | null }) =>
      prisma.task.updateMany({
        where: { id: u.id, userId },
        data: {
          ...(u.category && { category: u.category as TaskCategory }),
          ...(u.order !== undefined && { order: u.order }),
          ...(u.completed !== undefined && { completed: u.completed }),
          ...(u.deadline !== undefined && { deadline: u.deadline ? new Date(u.deadline) : null }),
        },
      })
    )
  );

  return NextResponse.json({ updated: results.length });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.task.deleteMany({
    where: { id, userId },
  });

  return NextResponse.json({ success: true });
}
