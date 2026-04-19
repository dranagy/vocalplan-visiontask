import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTasksFromImage } from "@/lib/gemini-vision";
import { TaskCategory, TaskSource } from "@/types";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { base64Image, mimeType, teamId } = await request.json();

    if (!base64Image) {
      return NextResponse.json(
        { error: "Missing base64Image" },
        { status: 400 }
      );
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

    // Analyze image with Gemini Vision
    const data = await extractTasksFromImage(base64Image, mimeType);

    // Create tasks from AI results
    const dateStr = new Date().toISOString().split("T")[0];
    const createdTasks = await Promise.all(
      data.tasks.map((t) =>
        prisma.task.create({
          data: {
            title: t.title,
            description: t.description,
            category: TaskCategory.URGENT_IMPORTANT,
            source: TaskSource.IMAGE,
            status: "TODO",
            date: new Date(dateStr),
            deadline: t.deadline ? new Date(t.deadline) : null,
            assigneeId: t.resourceName || null,
            userId,
            teamId: teamId || null,
          },
        })
      )
    );

    // Save image note
    await prisma.imageNote.create({
      data: {
        imageUrl: base64Image.substring(0, 100), // Store a reference, not the full base64
        extractedText: data.tasks.map((t) => t.title).join("; "),
        date: new Date(dateStr),
        userId,
        teamId: teamId || null,
      },
    });

    return NextResponse.json({ tasks: createdTasks }, { status: 201 });
  } catch (error) {
    console.error("Analyze-image API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
