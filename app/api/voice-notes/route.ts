import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date query param is required" }, { status: 400 });
  }

  const voiceNotes = await prisma.voiceNote.findMany({
    where: {
      userId: session.user.id,
      date: new Date(date),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(voiceNotes);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { audioUrl, transcript, duration, date } = await request.json();

  if (!audioUrl || !duration || !date) {
    return NextResponse.json({ error: "audioUrl, duration, and date are required" }, { status: 400 });
  }

  const voiceNote = await prisma.voiceNote.create({
    data: {
      audioUrl,
      transcript: transcript || null,
      duration,
      date: new Date(date),
      userId: session.user.id,
    },
  });

  return NextResponse.json(voiceNote, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.voiceNote.deleteMany({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
