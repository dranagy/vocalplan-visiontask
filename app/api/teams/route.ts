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

  try {
  const teams = await prisma.team.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      _count: { select: { tasks: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(teams);
  } catch (error) {
    console.error("Teams GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/teams — create a team
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
  const { name } = await request.json();
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Team name must be at least 2 characters" }, { status: 400 });
  }

  // Generate unique 8-char invite code with collision retry
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let inviteCode = "";
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    inviteCode = "";
    for (let i = 0; i < 8; i++) {
      inviteCode += chars[Math.floor(Math.random() * chars.length)];
    }
    const existing = await prisma.team.findUnique({ where: { inviteCode } });
    if (!existing) break;
    if (attempt === maxRetries - 1) {
      return NextResponse.json({ error: "Failed to generate unique invite code, please try again" }, { status: 500 });
    }
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
  } catch (error) {
    console.error("Teams POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
