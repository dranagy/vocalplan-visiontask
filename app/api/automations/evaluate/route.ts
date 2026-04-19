import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskCategory, TaskStatus } from "@prisma/client";

interface TaskData {
  id: string;
  title: string;
  status: string;
  userId: string;
  teamId?: string | null;
  date: Date | string;
  category?: string;
  deadline?: string | null;
  completed?: boolean;
}

const VALID_CATEGORIES = new Set(Object.values(TaskCategory));

async function fireAction(
  automationId: string,
  actionType: string,
  actionConfig: string,
  taskData: TaskData,
  userId: string
) {
  let config: Record<string, string> = {};
  try {
    config = JSON.parse(actionConfig);
  } catch {
    config = {};
  }

  const taskCategory = VALID_CATEGORIES.has(taskData.category as TaskCategory)
    ? (taskData.category as TaskCategory)
    : TaskCategory.URGENT_IMPORTANT;

  try {
    if (actionType === "create_task") {
      const titleTemplate = config.titleTemplate || "Follow-up: {{task.title}}";
      const title = titleTemplate.replace("{{task.title}}", taskData.title);
      const taskDate = typeof taskData.date === "string" ? new Date(taskData.date) : taskData.date;
      const followUpDate = new Date(taskDate);
      followUpDate.setDate(followUpDate.getDate() + 1);

      await prisma.task.create({
        data: {
          title,
          description: `Auto-created follow-up for: ${taskData.title}`,
          category: taskCategory,
          status: TaskStatus.TODO,
          source: "MANUAL",
          date: followUpDate,
          userId,
          teamId: taskData.teamId || null,
        },
      });
    } else if (actionType === "webhook") {
      const url = config.url;
      if (url) {
        let webhookOk = false;
        try {
          const webhookRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ automation: automationId, task: taskData }),
            signal: AbortSignal.timeout(5000),
          });
          webhookOk = webhookRes.ok;
        } catch {
          webhookOk = false;
        }
        if (!webhookOk) {
          await prisma.automationLog.create({
            data: { automationId, status: "failed", message: `Webhook call to ${url} failed or returned non-2xx` },
          });
          await prisma.automation.update({ where: { id: automationId }, data: { lastRunAt: new Date() } });
          return;
        }
      }
    }

    await prisma.automationLog.create({
      data: { automationId, status: "success", message: `Action ${actionType} executed` },
    });
    await prisma.automation.update({
      where: { id: automationId },
      data: { lastRunAt: new Date() },
    });
  } catch (error) {
    await prisma.automationLog.create({
      data: {
        automationId,
        status: "failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { taskId, event, taskData } = await request.json();

    if (!taskId || !event || !taskData) {
      return NextResponse.json({ error: "taskId, event, and taskData are required" }, { status: 400 });
    }

    const automations = await prisma.automation.findMany({
      where: { userId, enabled: true },
    });

    const fired: string[] = [];

    for (const automation of automations) {
      let shouldFire = false;
      let triggerConfig: Record<string, string> = {};
      try {
        triggerConfig = JSON.parse(automation.triggerConfig);
      } catch {
        triggerConfig = {};
      }

      if (automation.triggerType === "task_status_change" && event === "task_updated") {
        const toStatus = triggerConfig.toStatus;
        if (toStatus && taskData.status === toStatus) {
          shouldFire = true;
        }
      } else if (automation.triggerType === "task_overdue" && event === "task_updated") {
        const deadline = taskData.deadline ? new Date(taskData.deadline) : null;
        if (deadline && deadline < new Date() && !taskData.completed) {
          shouldFire = true;
        }
      }

      if (shouldFire) {
        fired.push(automation.id);
        await fireAction(automation.id, automation.actionType, automation.actionConfig, taskData, userId);
      }
    }

    return NextResponse.json({ evaluated: automations.length, fired: fired.length });
  } catch (error) {
    console.error("Automations evaluate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

