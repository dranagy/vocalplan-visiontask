import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SSEController = ReadableStreamDefaultController;

// Module-level map: teamId -> set of SSE controllers
const connections = new Map<string, Set<SSEController>>();

function broadcast(teamId: string, data: object, excludeController?: SSEController) {
  const clients = connections.get(teamId);
  if (!clients) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const ctrl of clients) {
    if (ctrl !== excludeController) {
      try {
        ctrl.enqueue(new TextEncoder().encode(payload));
      } catch {
        clients.delete(ctrl);
      }
    }
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  const userId = searchParams.get("userId") || session.user.id;
  const userName = searchParams.get("userName") || session.user.name || session.user.email || "Unknown";

  if (!teamId) {
    return new Response("teamId required", { status: 400 });
  }

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });
  if (!membership) {
    return new Response("Not a team member", { status: 403 });
  }

  const encoder = new TextEncoder();
  let controller: SSEController;

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      if (!connections.has(teamId)) {
        connections.set(teamId, new Set());
      }
      connections.get(teamId)!.add(controller);

      // Send initial connection event
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", userId, userName })}\n\n`));

      // Broadcast join to others
      broadcast(teamId, { type: "join", userId, userName }, controller);

      // Heartbeat every 15s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        connections.get(teamId)?.delete(controller);
        broadcast(teamId, { type: "leave", userId, userName });
      });
    },
    cancel() {
      connections.get(teamId)?.delete(controller);
      broadcast(teamId, { type: "leave", userId, userName });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, event } = await request.json();
  if (!teamId || !event) {
    return NextResponse.json({ error: "teamId and event required" }, { status: 400 });
  }

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a team member" }, { status: 403 });
  }

  broadcast(teamId, event);
  return NextResponse.json({ ok: true });
}
