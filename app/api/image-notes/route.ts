import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "date query param is required" }, { status: 400 });
    }

    const imageNotes = await prisma.imageNote.findMany({
      where: { userId, date: new Date(date) },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(imageNotes);
  } catch (error) {
    console.error("Image notes GET error:", error);
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
    const { imageUrl, extractedText, date, teamId } = await request.json();

    if (!imageUrl || !date) {
      return NextResponse.json({ error: "imageUrl and date are required" }, { status: 400 });
    }

    // Verify team membership if teamId provided
    if (teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId } },
      });
      if (!membership) {
        return NextResponse.json({ error: "Not a team member" }, { status: 403 });
      }
    }

    const imageNote = await prisma.imageNote.create({
      data: {
        imageUrl,
        extractedText: extractedText || null,
        date: new Date(date),
        userId,
        teamId: teamId || null,
      },
    });

    return NextResponse.json(imageNote, { status: 201 });
  } catch (error) {
    console.error("Image notes POST error:", error);
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

    const existing = await prisma.imageNote.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Image note not found" }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.imageNote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Image notes DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
