import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  try {
    let chatSession = await prisma.chatSession.findFirst({
      where: { userId, date: new Date(date) },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: { userId, date: new Date(date) },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    return NextResponse.json({
      sessionId: chatSession.id,
      messages: chatSession.messages,
    });
  } catch (error) {
    console.error("Copilot GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { sessionId, message, tasks, date } = await request.json();

  if (!sessionId || !message) {
    return NextResponse.json({ error: "sessionId and message are required" }, { status: 400 });
  }

  const chatSession = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!chatSession || chatSession.userId !== userId) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const systemPrompt = `You are an AI planning assistant for VocalPlan + VisionTask, a smart task management app.
Today's date is ${date || new Date().toISOString().split("T")[0]}.
The user has the following tasks for today:
${Array.isArray(tasks) && tasks.length > 0
    ? tasks.map((t: { title: string; category: string; status: string; completed?: boolean }) =>
      `- [${t.category}] ${t.title} (status: ${t.status}${t.completed ? ", completed" : ""})`
    ).join("\n")
    : "No tasks yet for today."}

Help the user plan their day, prioritize tasks, suggest strategies, and answer questions about productivity and time management. Be concise, helpful, and encouraging.`;

  const history = chatSession.messages.map((m) => ({
    role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
    parts: [{ text: m.content }],
  }));

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const chat = ai.chats.create({
          model: "gemini-2.0-flash",
          history,
          config: { systemInstruction: systemPrompt },
        });

        const result = await chat.sendMessageStream({ message });

        for await (const chunk of result) {
          const text = chunk.text ?? "";
          if (text) {
            fullResponse += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();

        await prisma.chatMessage.create({
          data: { sessionId, role: "user", content: message },
        });
        await prisma.chatMessage.create({
          data: { sessionId, role: "assistant", content: fullResponse },
        });
      } catch (error) {
        console.error("Copilot stream error:", error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "AI error" })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
