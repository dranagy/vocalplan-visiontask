import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/teams/[id]/members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: teamId } = await params;

  try {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a team member" }, { status: 403 });
  }

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json(members);
  } catch (error) {
    console.error("Team members GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/teams/[id]/members — remove a member (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: teamId } = await params;

  try {
  const requester = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (!requester || requester.role !== "OWNER") {
    return NextResponse.json({ error: "Only the team owner can remove members" }, { status: 403 });
  }

  const { userId: targetUserId } = await request.json();
  if (!targetUserId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Don't remove the last owner
  const target = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: targetUserId } },
  });
  if (target?.role === "OWNER") {
    return NextResponse.json({ error: "Cannot remove the team owner" }, { status: 400 });
  }

  await prisma.teamMember.deleteMany({
    where: { teamId, userId: targetUserId },
  });

  return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team members DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
