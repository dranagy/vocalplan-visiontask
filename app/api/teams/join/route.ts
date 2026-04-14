import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/teams/join — join a team by invite code
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { inviteCode } = await request.json();
  if (!inviteCode) {
    return NextResponse.json({ error: "inviteCode is required" }, { status: 400 });
  }

  const team = await prisma.team.findUnique({ where: { inviteCode } });
  if (!team) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: team.id, userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  const member = await prisma.teamMember.create({
    data: { teamId: team.id, userId, role: "MEMBER" },
  });

  return NextResponse.json({ team, member }, { status: 201 });
}
