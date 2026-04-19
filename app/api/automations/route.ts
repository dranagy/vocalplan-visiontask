import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TRIGGER_TYPES = new Set(["task_status_change", "task_overdue", "recurring"]);
const VALID_ACTION_TYPES = new Set(["create_task", "webhook", "notify"]);

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const automations = await prisma.automation.findMany({
      where: { userId },
      include: {
        logs: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(automations);
  } catch (error) {
    console.error("Automations GET error:", error);
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
    const body = await request.json();
    const { name, triggerType, triggerConfig, actionType, actionConfig, teamId } = body;

    if (!name || !triggerType || !actionType) {
      return NextResponse.json({ error: "name, triggerType, and actionType are required" }, { status: 400 });
    }
    if (!VALID_TRIGGER_TYPES.has(triggerType)) {
      return NextResponse.json({ error: `Invalid triggerType: ${triggerType}` }, { status: 400 });
    }
    if (!VALID_ACTION_TYPES.has(actionType)) {
      return NextResponse.json({ error: `Invalid actionType: ${actionType}` }, { status: 400 });
    }

    const automation = await prisma.automation.create({
      data: {
        userId,
        teamId: teamId || null,
        name,
        triggerType,
        triggerConfig: typeof triggerConfig === "string" ? triggerConfig : JSON.stringify(triggerConfig || {}),
        actionType,
        actionConfig: typeof actionConfig === "string" ? actionConfig : JSON.stringify(actionConfig || {}),
      },
    });
    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error("Automations POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { id, enabled, name, triggerConfig, actionConfig } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.automation.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    const updated = await prisma.automation.update({
      where: { id },
      data: {
        ...(enabled !== undefined && { enabled }),
        ...(name !== undefined && { name }),
        ...(triggerConfig !== undefined && {
          triggerConfig: typeof triggerConfig === "string" ? triggerConfig : JSON.stringify(triggerConfig),
        }),
        ...(actionConfig !== undefined && {
          actionConfig: typeof actionConfig === "string" ? actionConfig : JSON.stringify(actionConfig),
        }),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Automations PATCH error:", error);
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.automation.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    await prisma.automation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Automations DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
