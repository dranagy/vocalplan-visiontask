import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/teams — list user's teams
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const teams = await prisma.team.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      _count: { select: { tasks: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(teams);
}

// POST /api/teams — create a team
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { name } = await request.json();
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Team name must be at least 2 characters" }, { status: 400 });
  }

  // Generate unique 8-char invite code
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let inviteCode = "";
  for (let i = 0; i < 8; i++) {
    inviteCode += chars[Math.floor(Math.random() * chars.length)];
  }

  const team = await prisma.team.create({
    data: {
      name: name.trim(),
      inviteCode,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  return NextResponse.json(team, { status: 201 });
}
