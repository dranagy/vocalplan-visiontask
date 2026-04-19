import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";
import { extractTasksFromImage } from "@/lib/gemini-vision";
import { TaskCategory } from "@/types";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const date = (formData.get("date") as string) || new Date().toISOString().split("T")[0];
    const teamId = formData.get("teamId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId } },
      });
      if (!membership) {
        return NextResponse.json({ error: "Not a team member" }, { status: 403 });
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type;

    let extractedTasks: { title: string; description: string; deadline: string; resourceName: string }[] = [];

    if (mimeType === "application/pdf") {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: {
          parts: [
            {
              inlineData: { data: base64, mimeType: "application/pdf" },
            },
            {
              text: `Analyze this document and extract actionable tasks. For each task, identify the title, description, deadline (if mentioned), and resource/person responsible. Return JSON matching the schema.`,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object" as const,
            properties: {
              tasks: {
                type: "array" as const,
                items: {
                  type: "object" as const,
                  properties: {
                    title: { type: "string" as const },
                    description: { type: "string" as const },
                    deadline: { type: "string" as const },
                    resourceName: { type: "string" as const },
                  },
                  required: ["title", "description", "deadline", "resourceName"],
                },
              },
            },
            required: ["tasks"],
          },
        },
      });
      try {
        const parsed = JSON.parse(response.text || "{}");
        extractedTasks = parsed.tasks || [];
      } catch {
        extractedTasks = [];
      }
    } else {
      const result = await extractTasksFromImage(base64, mimeType);
      extractedTasks = result.tasks;
    }

    const createdTasks = await Promise.all(
      extractedTasks.map((t) =>
        prisma.task.create({
          data: {
            title: t.title,
            description: t.description,
            category: TaskCategory.URGENT_IMPORTANT,
            source: "DOCUMENT",
            status: "TODO",
            date: new Date(date),
            deadline: t.deadline ? new Date(t.deadline) : null,
            // resourceName is a display name, not a userId — store in description context only
            assigneeId: null,
            userId,
            teamId: teamId || null,
          },
        })
      )
    );

    return NextResponse.json({ tasks: createdTasks }, { status: 201 });
  } catch (error) {
    console.error("Analyze-document error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
