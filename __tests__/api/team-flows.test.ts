/**
 * Team Feature — End-to-End Flow Tests
 *
 * These tests simulate the real user journeys that exercise the team feature
 * from start to finish, chaining API calls the way the UI would:
 *
 *  Flow 1 – Team creation & invite join
 *  Flow 2 – Team task lifecycle (create → view → complete → reorder → delete)
 *  Flow 3 – Personal vs team context isolation
 *  Flow 4 – Owner removes a member
 *  Flow 5 – Voice-analysis tasks land under the selected team
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("../../lib/auth", () => ({ auth: vi.fn() }));
vi.mock("../../lib/prisma", () => ({
  prisma: {
    team: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    teamMember: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

import {
  GET as teamsGET,
  POST as teamsPOST,
} from "../../app/api/teams/route";
import { POST as joinPOST } from "../../app/api/teams/join/route";
import {
  GET as membersGET,
  DELETE as membersDELETE,
} from "../../app/api/teams/[id]/members/route";
import {
  GET as tasksGET,
  POST as tasksPOST,
  PATCH as tasksPATCH,
  DELETE as tasksDELETE,
} from "../../app/api/tasks/route";

// ── Helpers ────────────────────────────────────────────────────────────────
function login(userId: string) {
  vi.mocked(auth).mockResolvedValue({ user: { id: userId } } as never);
}

function req(
  body: object | null,
  method = "POST",
  url = "http://localhost/api"
) {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== null ? { body: JSON.stringify(body) } : {}),
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ════════════════════════════════════════════════════════════════════════════
// Flow 1 — Alice creates a team, Bob joins with the invite code, both users
//          appear in the members list
// ════════════════════════════════════════════════════════════════════════════
describe("Flow 1 — Create team & invite join", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Alice creates a team, Bob joins, and both appear as members", async () => {
    // ── Step 1: Alice creates a team ─────────────────────────────────
    login("alice");

    // No invite-code collision
    vi.mocked(prisma.team.findUnique).mockResolvedValue(null as never);

    const createdTeam = {
      id: "team-1",
      name: "Project X",
      inviteCode: "PROJ1234",
      members: [
        {
          id: "m1",
          userId: "alice",
          role: "OWNER",
          user: { id: "alice", name: "Alice", email: "alice@example.com" },
        },
      ],
    };
    vi.mocked(prisma.team.create).mockResolvedValue(createdTeam as never);

    const createRes = await teamsPOST(req({ name: "Project X" }));
    expect(createRes.status).toBe(201);
    const team = await createRes.json();
    expect(team.name).toBe("Project X");
    expect(team.inviteCode).toBe("PROJ1234");

    // ── Step 2: Alice lists her teams and sees it ────────────────────
    vi.mocked(prisma.team.findMany).mockResolvedValue([
      { ...createdTeam, _count: { tasks: 0, members: 1 } },
    ] as never);

    const listRes = await teamsGET();
    expect(listRes.status).toBe(200);
    const aliceTeams = await listRes.json();
    expect(aliceTeams).toHaveLength(1);
    expect(aliceTeams[0].name).toBe("Project X");

    // ── Step 3: Bob joins using the invite code ──────────────────────
    login("bob");
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: "bob" } } as never);

    vi.mocked(prisma.team.findUnique).mockResolvedValue({
      id: "team-1",
      name: "Project X",
      inviteCode: "PROJ1234",
    } as never);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.teamMember.create).mockResolvedValue({
      id: "m2",
      teamId: "team-1",
      userId: "bob",
      role: "MEMBER",
    } as never);

    const joinRes = await joinPOST(req({ inviteCode: "PROJ1234" }));
    expect(joinRes.status).toBe(201);
    const joinData = await joinRes.json();
    expect(joinData.member.role).toBe("MEMBER");
    expect(joinData.team.name).toBe("Project X");

    // ── Step 4: Alice views the members list — both appear ───────────
    login("alice");

    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
      id: "m1",
      role: "OWNER",
    } as never);

    const allMembers = [
      {
        id: "m1",
        userId: "alice",
        role: "OWNER",
        user: { id: "alice", name: "Alice", email: "alice@example.com" },
      },
      {
        id: "m2",
        userId: "bob",
        role: "MEMBER",
        user: { id: "bob", name: "Bob", email: "bob@example.com" },
      },
    ];
    vi.mocked(prisma.teamMember.findMany).mockResolvedValue(
      allMembers as never
    );

    const membersRes = await membersGET(
      req(null, "GET"),
      params("team-1")
    );
    expect(membersRes.status).toBe(200);
    const members = await membersRes.json();
    expect(members).toHaveLength(2);
    expect(members.map((m: { user: { name: string } }) => m.user.name)).toEqual([
      "Alice",
      "Bob",
    ]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Flow 2 — Full team-task lifecycle: create → list → complete → reorder → delete
// ════════════════════════════════════════════════════════════════════════════
describe("Flow 2 — Team task lifecycle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a team task, lists it, completes it, reorders it, then deletes it", async () => {
    login("alice");
    const teamId = "team-1";

    // ── Step 1: Create a task under the team ─────────────────────────
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
      id: "m1",
    } as never);

    const taskObj = {
      id: "task-1",
      title: "Prepare slides",
      category: "URGENT_IMPORTANT",
      date: new Date("2026-04-15"),
      userId: "alice",
      teamId,
      completed: false,
      order: 0,
    };
    vi.mocked(prisma.task.create).mockResolvedValue(taskObj as never);

    const createRes = await tasksPOST(
      req({
        title: "Prepare slides",
        category: "URGENT_IMPORTANT",
        date: "2026-04-15",
        teamId,
      })
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.title).toBe("Prepare slides");
    expect(created.teamId).toBe(teamId);

    // ── Step 2: List team tasks for today ─────────────────────────────
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
      id: "m1",
    } as never);
    vi.mocked(prisma.task.findMany).mockResolvedValue([taskObj] as never);

    const listRes = await tasksGET(
      req(null, "GET", `http://localhost/api/tasks?date=2026-04-15&teamId=${teamId}`)
    );
    expect(listRes.status).toBe(200);
    const tasks = await listRes.json();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Prepare slides");

    // ── Step 3: Mark the task completed ───────────────────────────────
    vi.mocked(prisma.task.findUnique).mockResolvedValue(taskObj as never);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
      id: "m1",
    } as never);
    vi.mocked(prisma.task.update).mockResolvedValue({
      ...taskObj,
      completed: true,
    } as never);

    const patchRes = await tasksPATCH(
      req({ tasks: [{ id: "task-1", completed: true }] }, "PATCH")
    );
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.updated).toBe(1);

    // ── Step 4: Reorder — move task to a different category ───────────
    vi.mocked(prisma.task.findUnique).mockResolvedValue({
      ...taskObj,
      completed: true,
    } as never);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
      id: "m1",
    } as never);
    vi.mocked(prisma.task.update).mockResolvedValue({
      ...taskObj,
      category: "IMPORTANT_NOT_URGENT",
      order: 1,
    } as never);

    const reorderRes = await tasksPATCH(
      req(
        {
          tasks: [
            { id: "task-1", category: "IMPORTANT_NOT_URGENT", order: 1 },
          ],
        },
        "PATCH"
      )
    );
    expect(reorderRes.status).toBe(200);
    expect((await reorderRes.json()).updated).toBe(1);

    // ── Step 5: Delete the task ──────────────────────────────────────
    vi.mocked(prisma.task.findUnique).mockResolvedValue({
      ...taskObj,
      teamId,
    } as never);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
      id: "m1",
    } as never);
    vi.mocked(prisma.task.delete).mockResolvedValue({} as never);

    const deleteRes = await tasksDELETE(
      req({ id: "task-1" }, "DELETE")
    );
    expect(deleteRes.status).toBe(200);
    expect((await deleteRes.json()).success).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Flow 3 — Personal vs team context: tasks are isolated per context
// ════════════════════════════════════════════════════════════════════════════
describe("Flow 3 — Personal vs team context isolation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("personal tasks and team tasks are fetched independently", async () => {
    login("alice");

    // ── Step 1: Fetch personal tasks (no teamId) ──────────────────────
    const personalTasks = [
      { id: "p1", title: "Buy groceries", category: "URGENT_IMPORTANT", userId: "alice", teamId: null },
    ];
    vi.mocked(prisma.task.findMany).mockResolvedValue(personalTasks as never);

    const personalRes = await tasksGET(
      req(null, "GET", "http://localhost/api/tasks?date=2026-04-15")
    );
    expect(personalRes.status).toBe(200);
    const personal = await personalRes.json();
    expect(personal).toHaveLength(1);
    expect(personal[0].title).toBe("Buy groceries");

    // Verify the query filter — personal context uses userId + teamId=null
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "alice", teamId: null }),
      })
    );

    // ── Step 2: Switch to team context ────────────────────────────────
    vi.clearAllMocks();
    login("alice");

    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
      id: "m1",
    } as never);

    const teamTasks = [
      { id: "t1", title: "Code review", category: "IMPORTANT_NOT_URGENT", userId: "alice", teamId: "team-1" },
      { id: "t2", title: "Deploy v2", category: "URGENT_IMPORTANT", userId: "bob", teamId: "team-1" },
    ];
    vi.mocked(prisma.task.findMany).mockResolvedValue(teamTasks as never);

    const teamRes = await tasksGET(
      req(null, "GET", "http://localhost/api/tasks?date=2026-04-15&teamId=team-1")
    );
    expect(teamRes.status).toBe(200);
    const teamData = await teamRes.json();
    expect(teamData).toHaveLength(2);

    // Verify the query filter — team context uses teamId only (all members see all tasks)
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ teamId: "team-1" }),
      })
    );
    // userId should NOT be in the where clause for team tasks
    const callArgs = vi.mocked(prisma.task.findMany).mock.calls[0][0] as {
      where: Record<string, unknown>;
    };
    expect(callArgs.where).not.toHaveProperty("userId");
  });

  it("creating a task without teamId keeps it personal, with teamId puts it under the team", async () => {
    login("alice");

    // ── Personal task creation ────────────────────────────────────────
    vi.mocked(prisma.task.create).mockResolvedValue({
      id: "p1",
      title: "Personal thing",
      teamId: null,
      userId: "alice",
    } as never);

    const personalRes = await tasksPOST(
      req({ title: "Personal thing", category: "URGENT_IMPORTANT", date: "2026-04-15" })
    );
    expect(personalRes.status).toBe(201);
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ teamId: null }),
      })
    );

    // ── Team task creation ────────────────────────────────────────────
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
      id: "m1",
    } as never);
    vi.mocked(prisma.task.create).mockResolvedValue({
      id: "t1",
      title: "Team thing",
      teamId: "team-1",
      userId: "alice",
    } as never);

    const teamRes = await tasksPOST(
      req({
        title: "Team thing",
        category: "URGENT_IMPORTANT",
        date: "2026-04-15",
        teamId: "team-1",
      })
    );
    expect(teamRes.status).toBe(201);
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ teamId: "team-1" }),
      })
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Flow 4 — Owner removes a member; that member can no longer access team tasks
// ════════════════════════════════════════════════════════════════════════════
describe("Flow 4 — Owner removes a member", () => {
  beforeEach(() => vi.clearAllMocks());

  it("after removal the ex-member gets 403 when fetching team tasks", async () => {
    // ── Step 1: Alice (owner) removes Bob ─────────────────────────────
    login("alice");

    vi.mocked(prisma.teamMember.findUnique)
      .mockResolvedValueOnce({ id: "m1", role: "OWNER" } as never) // requester check
      .mockResolvedValueOnce({ id: "m2", role: "MEMBER" } as never); // target check
    vi.mocked(prisma.teamMember.deleteMany).mockResolvedValue({
      count: 1,
    } as never);

    const removeRes = await membersDELETE(
      req({ userId: "bob" }, "DELETE"),
      params("team-1")
    );
    expect(removeRes.status).toBe(200);
    expect((await removeRes.json()).success).toBe(true);

    // ── Step 2: Bob tries to fetch team tasks → 403 ──────────────────
    login("bob");

    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null as never);

    const tasksRes = await tasksGET(
      req(
        null,
        "GET",
        "http://localhost/api/tasks?date=2026-04-15&teamId=team-1"
      )
    );
    expect(tasksRes.status).toBe(403);

    // ── Step 3: Bob also can't view member list → 403 ────────────────
    const membersRes = await membersGET(
      req(null, "GET"),
      params("team-1")
    );
    expect(membersRes.status).toBe(403);

    // ── Step 4: Bob also can't create team tasks → 403 ──────────────
    const createRes = await tasksPOST(
      req({
        title: "Sneaky",
        category: "URGENT_IMPORTANT",
        date: "2026-04-15",
        teamId: "team-1",
      })
    );
    expect(createRes.status).toBe(403);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Flow 5 — AI voice-analysis creates tasks under the selected team
// ════════════════════════════════════════════════════════════════════════════
describe("Flow 5 — Batch task creation under a team (simulates voice recording)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("batch-creates tasks under the team when teamId is provided", async () => {
    login("alice");

    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
      id: "m1",
    } as never);
    vi.mocked(prisma.task.createMany).mockResolvedValue({
      count: 3,
    } as never);

    // Simulates what PlannerApp.handleRecordingComplete does: it batches all
    // AI-categorized tasks with the currently selected teamId.
    const res = await tasksPOST(
      req({
        tasks: [
          {
            title: "Review PR #42",
            category: "URGENT_IMPORTANT",
            date: "2026-04-15",
            teamId: "team-1",
          },
          {
            title: "Update docs",
            category: "IMPORTANT_NOT_URGENT",
            date: "2026-04-15",
            teamId: "team-1",
          },
          {
            title: "Fix lint warnings",
            category: "URGENT_NOT_IMPORTANT",
            date: "2026-04-15",
            teamId: "team-1",
          },
        ],
      })
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.count).toBe(3);

    // Verify that every task in the batch was associated with the team
    const callArgs = vi.mocked(prisma.task.createMany).mock.calls[0][0] as {
      data: Array<{ teamId: string | null }>;
    };
    expect(callArgs.data).toHaveLength(3);
    for (const t of callArgs.data) {
      expect(t.teamId).toBe("team-1");
    }
  });

  it("batch-creates personal tasks when no teamId is provided (personal mode)", async () => {
    login("alice");

    vi.mocked(prisma.task.createMany).mockResolvedValue({
      count: 2,
    } as never);

    const res = await tasksPOST(
      req({
        tasks: [
          {
            title: "Meal prep",
            category: "IMPORTANT_NOT_URGENT",
            date: "2026-04-15",
          },
          {
            title: "Pay bills",
            category: "URGENT_IMPORTANT",
            date: "2026-04-15",
          },
        ],
      })
    );

    expect(res.status).toBe(201);
    expect((await res.json()).count).toBe(2);

    const callArgs = vi.mocked(prisma.task.createMany).mock.calls[0][0] as {
      data: Array<{ teamId: string | null }>;
    };
    for (const t of callArgs.data) {
      expect(t.teamId).toBeNull();
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Flow 6 — Another team member can edit/complete tasks they didn't create
// ════════════════════════════════════════════════════════════════════════════
describe("Flow 6 — Cross-member task editing in a team", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Bob can complete and delete a task created by Alice under the same team", async () => {
    const teamId = "team-1";

    // ── Step 1: Alice creates a team task ─────────────────────────────
    login("alice");
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
      id: "m1",
    } as never);

    const taskObj = {
      id: "task-1",
      title: "Write tests",
      category: "URGENT_IMPORTANT",
      date: new Date("2026-04-15"),
      userId: "alice",
      teamId,
      completed: false,
      order: 0,
    };
    vi.mocked(prisma.task.create).mockResolvedValue(taskObj as never);

    const createRes = await tasksPOST(
      req({
        title: "Write tests",
        category: "URGENT_IMPORTANT",
        date: "2026-04-15",
        teamId,
      })
    );
    expect(createRes.status).toBe(201);

    // ── Step 2: Bob (teammate) completes Alice's task ─────────────────
    login("bob");
    vi.mocked(prisma.task.findUnique).mockResolvedValue(taskObj as never);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
      id: "m2",
    } as never);
    vi.mocked(prisma.task.update).mockResolvedValue({
      ...taskObj,
      completed: true,
    } as never);

    const completeRes = await tasksPATCH(
      req({ tasks: [{ id: "task-1", completed: true }] }, "PATCH")
    );
    expect(completeRes.status).toBe(200);
    expect((await completeRes.json()).updated).toBe(1);

    // ── Step 3: Bob deletes the task ──────────────────────────────────
    vi.mocked(prisma.task.findUnique).mockResolvedValue(taskObj as never);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
      id: "m2",
    } as never);
    vi.mocked(prisma.task.delete).mockResolvedValue({} as never);

    const deleteRes = await tasksDELETE(
      req({ id: "task-1" }, "DELETE")
    );
    expect(deleteRes.status).toBe(200);
    expect((await deleteRes.json()).success).toBe(true);
  });
});
