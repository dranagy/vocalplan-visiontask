import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("../../lib/auth", () => ({ auth: vi.fn() }));
vi.mock("../../lib/prisma", () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    teamMember: {
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import {
  GET,
  POST,
  PATCH,
  DELETE,
} from "../../app/api/tasks/route";

// ── Helpers ────────────────────────────────────────────────────────────────
const mockSession = (userId = "user-1") =>
  vi.mocked(auth).mockResolvedValue({ user: { id: userId } } as never);

const noSession = () =>
  vi.mocked(auth).mockResolvedValue(null as never);

function makeRequest(
  body: object | null,
  method = "POST",
  url = "http://localhost/api/tasks"
) {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== null ? { body: JSON.stringify(body) } : {}),
  });
}

// ── GET /api/tasks ─────────────────────────────────────────────────────────
describe("GET /api/tasks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    noSession();
    const res = await GET(makeRequest(null, "GET", "http://localhost/api/tasks?date=2026-01-01"));
    expect(res.status).toBe(401);
  });

  it("returns 400 when date is missing", async () => {
    mockSession();
    const res = await GET(makeRequest(null, "GET", "http://localhost/api/tasks"));
    expect(res.status).toBe(400);
  });

  it("returns personal tasks when no teamId", async () => {
    mockSession();
    const mockTasks = [
      { id: "task-1", title: "Do laundry", category: "URGENT_IMPORTANT", date: "2026-01-01" },
    ];
    vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);

    const res = await GET(makeRequest(null, "GET", "http://localhost/api/tasks?date=2026-01-01"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1", teamId: null }),
      })
    );
  });

  it("returns team tasks when teamId is provided and user is a member", async () => {
    mockSession();
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({ id: "m1" } as never);
    const mockTasks = [
      { id: "task-2", title: "Team task", category: "URGENT_IMPORTANT", teamId: "t1" },
    ];
    vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);

    const res = await GET(
      makeRequest(null, "GET", "http://localhost/api/tasks?date=2026-01-01&teamId=t1")
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ teamId: "t1" }),
      })
    );
  });

  it("returns 403 when requesting team tasks but not a member", async () => {
    mockSession();
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null as never);

    const res = await GET(
      makeRequest(null, "GET", "http://localhost/api/tasks?date=2026-01-01&teamId=t1")
    );
    expect(res.status).toBe(403);
  });

  it("returns 500 on database error", async () => {
    mockSession();
    vi.mocked(prisma.task.findMany).mockRejectedValue(new Error("DB error"));

    const res = await GET(makeRequest(null, "GET", "http://localhost/api/tasks?date=2026-01-01"));
    expect(res.status).toBe(500);
  });
});

// ── POST /api/tasks (single) ──────────────────────────────────────────────
describe("POST /api/tasks — single task", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    noSession();
    const res = await POST(
      makeRequest({ title: "Test", category: "URGENT_IMPORTANT", date: "2026-01-01" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    mockSession();
    const res = await POST(makeRequest({ title: "Test" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid category", async () => {
    mockSession();
    const res = await POST(
      makeRequest({ title: "Test", category: "INVALID", date: "2026-01-01" })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Invalid task category/i);
  });

  it("creates a personal task (no teamId)", async () => {
    mockSession();
    const created = {
      id: "task-1",
      title: "Test",
      category: "URGENT_IMPORTANT",
      date: "2026-01-01T00:00:00.000Z",
      userId: "user-1",
      teamId: null,
    };
    vi.mocked(prisma.task.create).mockResolvedValue(created as never);

    const res = await POST(
      makeRequest({ title: "Test", category: "URGENT_IMPORTANT", date: "2026-01-01" })
    );
    expect(res.status).toBe(201);
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1", teamId: null }),
      })
    );
  });

  it("creates a team task when user is a member", async () => {
    mockSession();
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({ id: "m1" } as never);
    const created = {
      id: "task-2",
      title: "Team task",
      category: "URGENT_IMPORTANT",
      date: "2026-01-01T00:00:00.000Z",
      userId: "user-1",
      teamId: "t1",
    };
    vi.mocked(prisma.task.create).mockResolvedValue(created as never);

    const res = await POST(
      makeRequest({ title: "Team task", category: "URGENT_IMPORTANT", date: "2026-01-01", teamId: "t1" })
    );
    expect(res.status).toBe(201);
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ teamId: "t1" }),
      })
    );
  });

  it("returns 403 when creating a team task but not a member", async () => {
    mockSession();
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null as never);

    const res = await POST(
      makeRequest({ title: "Sneaky", category: "URGENT_IMPORTANT", date: "2026-01-01", teamId: "t1" })
    );
    expect(res.status).toBe(403);
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  it("returns 500 on database error", async () => {
    mockSession();
    vi.mocked(prisma.task.create).mockRejectedValue(new Error("DB error"));

    const res = await POST(
      makeRequest({ title: "Test", category: "URGENT_IMPORTANT", date: "2026-01-01" })
    );
    expect(res.status).toBe(500);
  });
});

// ── POST /api/tasks (batch) ───────────────────────────────────────────────
describe("POST /api/tasks — batch create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates multiple personal tasks", async () => {
    mockSession();
    vi.mocked(prisma.task.createMany).mockResolvedValue({ count: 2 } as never);

    const res = await POST(
      makeRequest({
        tasks: [
          { title: "Task 1", category: "URGENT_IMPORTANT", date: "2026-01-01" },
          { title: "Task 2", category: "IMPORTANT_NOT_URGENT", date: "2026-01-01" },
        ],
      })
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.count).toBe(2);
  });

  it("creates batch team tasks when user is a member", async () => {
    mockSession();
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({ id: "m1" } as never);
    vi.mocked(prisma.task.createMany).mockResolvedValue({ count: 2 } as never);

    const res = await POST(
      makeRequest({
        tasks: [
          { title: "Team Task 1", category: "URGENT_IMPORTANT", date: "2026-01-01", teamId: "t1" },
          { title: "Team Task 2", category: "IMPORTANT_NOT_URGENT", date: "2026-01-01", teamId: "t1" },
        ],
      })
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.count).toBe(2);
  });

  it("returns 403 for batch create when not a team member", async () => {
    mockSession();
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null as never);

    const res = await POST(
      makeRequest({
        tasks: [
          { title: "Sneaky Task", category: "URGENT_IMPORTANT", date: "2026-01-01", teamId: "t1" },
        ],
      })
    );
    expect(res.status).toBe(403);
    expect(prisma.task.createMany).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid category in batch", async () => {
    mockSession();
    const res = await POST(
      makeRequest({
        tasks: [{ title: "Bad", category: "INVALID_CAT", date: "2026-01-01" }],
      })
    );
    expect(res.status).toBe(400);
  });
});

// ── PATCH /api/tasks ───────────────────────────────────────────────────────
describe("PATCH /api/tasks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    noSession();
    const res = await PATCH(
      makeRequest({ tasks: [{ id: "task-1", completed: true }] }, "PATCH")
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when tasks is not an array", async () => {
    mockSession();
    const res = await PATCH(makeRequest({ tasks: "not-array" }, "PATCH"));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid category in update", async () => {
    mockSession();
    const res = await PATCH(
      makeRequest({ tasks: [{ id: "task-1", category: "INVALID_CAT" }] }, "PATCH")
    );
    expect(res.status).toBe(400);
  });

  it("updates a personal task owned by the user", async () => {
    mockSession();
    const existingTask = { id: "task-1", userId: "user-1", teamId: null };
    vi.mocked(prisma.task.findUnique).mockResolvedValue(existingTask as never);
    vi.mocked(prisma.task.update).mockResolvedValue({ ...existingTask, completed: true } as never);

    const res = await PATCH(
      makeRequest({ tasks: [{ id: "task-1", completed: true }] }, "PATCH")
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.updated).toBe(1);
  });

  it("skips personal task not owned by the user", async () => {
    mockSession();
    const existingTask = { id: "task-1", userId: "user-2", teamId: null };
    vi.mocked(prisma.task.findUnique).mockResolvedValue(existingTask as never);

    const res = await PATCH(
      makeRequest({ tasks: [{ id: "task-1", completed: true }] }, "PATCH")
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.updated).toBe(0);
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it("updates a team task when user is a team member", async () => {
    mockSession();
    const existingTask = { id: "task-1", userId: "user-2", teamId: "t1" };
    vi.mocked(prisma.task.findUnique).mockResolvedValue(existingTask as never);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({ id: "m1" } as never);
    vi.mocked(prisma.task.update).mockResolvedValue({ ...existingTask, completed: true } as never);

    const res = await PATCH(
      makeRequest({ tasks: [{ id: "task-1", completed: true }] }, "PATCH")
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.updated).toBe(1);
  });

  it("skips team task when user is not a team member", async () => {
    mockSession();
    const existingTask = { id: "task-1", userId: "user-2", teamId: "t1" };
    vi.mocked(prisma.task.findUnique).mockResolvedValue(existingTask as never);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null as never);

    const res = await PATCH(
      makeRequest({ tasks: [{ id: "task-1", completed: true }] }, "PATCH")
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.updated).toBe(0);
  });

  it("verifies membership when reassigning task to a new team", async () => {
    mockSession();
    const existingTask = { id: "task-1", userId: "user-1", teamId: null };
    vi.mocked(prisma.task.findUnique).mockResolvedValue(existingTask as never);
    // First call: no team check needed (personal task), second call: verify target team membership
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({ id: "m1" } as never);
    vi.mocked(prisma.task.update).mockResolvedValue({ ...existingTask, teamId: "t1" } as never);

    const res = await PATCH(
      makeRequest({ tasks: [{ id: "task-1", teamId: "t1" }] }, "PATCH")
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.updated).toBe(1);
    expect(prisma.teamMember.findUnique).toHaveBeenCalledWith({
      where: { teamId_userId: { teamId: "t1", userId: "user-1" } },
    });
  });

  it("skips when reassigning to a team user is not a member of", async () => {
    mockSession();
    const existingTask = { id: "task-1", userId: "user-1", teamId: null };
    vi.mocked(prisma.task.findUnique).mockResolvedValue(existingTask as never);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null as never);

    const res = await PATCH(
      makeRequest({ tasks: [{ id: "task-1", teamId: "t2" }] }, "PATCH")
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.updated).toBe(0);
  });

  it("returns 500 on database error", async () => {
    mockSession();
    vi.mocked(prisma.task.findUnique).mockRejectedValue(new Error("DB error"));

    const res = await PATCH(
      makeRequest({ tasks: [{ id: "task-1", completed: true }] }, "PATCH")
    );
    expect(res.status).toBe(500);
  });
});

// ── DELETE /api/tasks ──────────────────────────────────────────────────────
describe("DELETE /api/tasks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    noSession();
    const res = await DELETE(makeRequest({ id: "task-1" }, "DELETE"));
    expect(res.status).toBe(401);
  });

  it("returns 400 when id is missing", async () => {
    mockSession();
    const res = await DELETE(makeRequest({}, "DELETE"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when task does not exist", async () => {
    mockSession();
    vi.mocked(prisma.task.findUnique).mockResolvedValue(null as never);
    const res = await DELETE(makeRequest({ id: "nonexistent" }, "DELETE"));
    expect(res.status).toBe(404);
  });

  it("deletes a personal task owned by the user", async () => {
    mockSession();
    vi.mocked(prisma.task.findUnique).mockResolvedValue({
      id: "task-1",
      userId: "user-1",
      teamId: null,
    } as never);
    vi.mocked(prisma.task.delete).mockResolvedValue({} as never);

    const res = await DELETE(makeRequest({ id: "task-1" }, "DELETE"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 403 when deleting another user's personal task", async () => {
    mockSession();
    vi.mocked(prisma.task.findUnique).mockResolvedValue({
      id: "task-1",
      userId: "user-2",
      teamId: null,
    } as never);

    const res = await DELETE(makeRequest({ id: "task-1" }, "DELETE"));
    expect(res.status).toBe(403);
  });

  it("deletes a team task when user is a team member", async () => {
    mockSession();
    vi.mocked(prisma.task.findUnique).mockResolvedValue({
      id: "task-1",
      userId: "user-2",
      teamId: "t1",
    } as never);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({ id: "m1" } as never);
    vi.mocked(prisma.task.delete).mockResolvedValue({} as never);

    const res = await DELETE(makeRequest({ id: "task-1" }, "DELETE"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 403 when deleting a team task and not a member", async () => {
    mockSession();
    vi.mocked(prisma.task.findUnique).mockResolvedValue({
      id: "task-1",
      userId: "user-2",
      teamId: "t1",
    } as never);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null as never);

    const res = await DELETE(makeRequest({ id: "task-1" }, "DELETE"));
    expect(res.status).toBe(403);
  });

  it("returns 500 on database error", async () => {
    mockSession();
    vi.mocked(prisma.task.findUnique).mockRejectedValue(new Error("DB error"));

    const res = await DELETE(makeRequest({ id: "task-1" }, "DELETE"));
    expect(res.status).toBe(500);
  });
});
