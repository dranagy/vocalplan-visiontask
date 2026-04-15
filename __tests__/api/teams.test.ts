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
  },
}));

import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { GET as teamsGET, POST as teamsPOST } from "../../app/api/teams/route";
import { POST as joinPOST } from "../../app/api/teams/join/route";
import {
  GET as membersGET,
  DELETE as membersDELETE,
} from "../../app/api/teams/[id]/members/route";

// ── Helpers ────────────────────────────────────────────────────────────────
const mockSession = (userId = "user-1") =>
  vi.mocked(auth).mockResolvedValue({ user: { id: userId } } as never);

const noSession = () =>
  vi.mocked(auth).mockResolvedValue(null as never);

function makeRequest(body: object | null, method = "POST") {
  return new NextRequest("http://localhost/api/teams", {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== null ? { body: JSON.stringify(body) } : {}),
  });
}

function makeParamsFn(id: string) {
  return Promise.resolve({ id });
}

// ── GET /api/teams ─────────────────────────────────────────────────────────
describe("GET /api/teams", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    noSession();
    const res = await teamsGET();
    expect(res.status).toBe(401);
  });

  it("returns team list for authenticated user", async () => {
    mockSession();
    const mockTeams = [
      { id: "t1", name: "Alpha", inviteCode: "ABC12345", members: [], _count: { tasks: 0, members: 1 } },
    ];
    vi.mocked(prisma.team.findMany).mockResolvedValue(mockTeams as never);

    const res = await teamsGET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Alpha");
  });

  it("returns 500 on database error", async () => {
    mockSession();
    vi.mocked(prisma.team.findMany).mockRejectedValue(new Error("DB error"));

    const res = await teamsGET();
    expect(res.status).toBe(500);
  });
});

// ── POST /api/teams ────────────────────────────────────────────────────────
describe("POST /api/teams", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    noSession();
    const res = await teamsPOST(makeRequest({ name: "My Team" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    mockSession();
    const res = await teamsPOST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when name is too short", async () => {
    mockSession();
    const res = await teamsPOST(makeRequest({ name: "A" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/at least 2/i);
  });

  it("creates a team and returns 201", async () => {
    mockSession();
    vi.mocked(prisma.team.findUnique).mockResolvedValue(null as never); // no collision
    const created = {
      id: "t1",
      name: "My Team",
      inviteCode: "ABCD1234",
      members: [{ userId: "user-1", role: "OWNER", user: { id: "user-1", name: "Alice", email: "alice@test.com" } }],
    };
    vi.mocked(prisma.team.create).mockResolvedValue(created as never);

    const res = await teamsPOST(makeRequest({ name: "My Team" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe("My Team");
    expect(prisma.team.create).toHaveBeenCalledOnce();
  });

  it("returns 500 on database error", async () => {
    mockSession();
    vi.mocked(prisma.team.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.team.create).mockRejectedValue(new Error("DB error"));

    const res = await teamsPOST(makeRequest({ name: "My Team" }));
    expect(res.status).toBe(500);
  });
});

// ── POST /api/teams/join ───────────────────────────────────────────────────
describe("POST /api/teams/join", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    noSession();
    const res = await joinPOST(makeRequest({ inviteCode: "ABCD1234" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when inviteCode is missing", async () => {
    mockSession();
    const res = await joinPOST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 for invalid invite code", async () => {
    mockSession();
    vi.mocked(prisma.team.findUnique).mockResolvedValue(null as never);
    const res = await joinPOST(makeRequest({ inviteCode: "INVALID1" }));
    expect(res.status).toBe(404);
  });

  it("returns 409 when already a member", async () => {
    mockSession();
    vi.mocked(prisma.team.findUnique).mockResolvedValue({ id: "t1", name: "Team A" } as never);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({ id: "m1" } as never);

    const res = await joinPOST(makeRequest({ inviteCode: "ABCD1234" }));
    expect(res.status).toBe(409);
  });

  it("joins team and returns 201", async () => {
    mockSession();
    vi.mocked(prisma.team.findUnique).mockResolvedValue({ id: "t1", name: "Team A" } as never);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null as never);
    const created = { id: "m2", teamId: "t1", userId: "user-1", role: "MEMBER" };
    vi.mocked(prisma.teamMember.create).mockResolvedValue(created as never);

    const res = await joinPOST(makeRequest({ inviteCode: "ABCD1234" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.member.role).toBe("MEMBER");
  });

  it("returns 500 on database error", async () => {
    mockSession();
    vi.mocked(prisma.team.findUnique).mockResolvedValue({ id: "t1" } as never);
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.teamMember.create).mockRejectedValue(new Error("DB error"));

    const res = await joinPOST(makeRequest({ inviteCode: "ABCD1234" }));
    expect(res.status).toBe(500);
  });
});

// ── GET /api/teams/[id]/members ────────────────────────────────────────────
describe("GET /api/teams/[id]/members", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    noSession();
    const res = await membersGET(makeRequest(null, "GET"), { params: makeParamsFn("t1") });
    expect(res.status).toBe(401);
  });

  it("returns 403 when not a team member", async () => {
    mockSession();
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null as never);
    const res = await membersGET(makeRequest(null, "GET"), { params: makeParamsFn("t1") });
    expect(res.status).toBe(403);
  });

  it("returns member list for team member", async () => {
    mockSession();
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({ id: "m1" } as never);
    const memberList = [
      { id: "m1", userId: "user-1", role: "OWNER", user: { id: "user-1", name: "Alice", email: "alice@test.com" } },
    ];
    vi.mocked(prisma.teamMember.findMany).mockResolvedValue(memberList as never);

    const res = await membersGET(makeRequest(null, "GET"), { params: makeParamsFn("t1") });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].user.name).toBe("Alice");
  });

  it("returns 500 on database error", async () => {
    mockSession();
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({ id: "m1" } as never);
    vi.mocked(prisma.teamMember.findMany).mockRejectedValue(new Error("DB error"));

    const res = await membersGET(makeRequest(null, "GET"), { params: makeParamsFn("t1") });
    expect(res.status).toBe(500);
  });
});

// ── DELETE /api/teams/[id]/members ─────────────────────────────────────────
describe("DELETE /api/teams/[id]/members", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    noSession();
    const res = await membersDELETE(makeRequest({ userId: "user-2" }, "DELETE"), { params: makeParamsFn("t1") });
    expect(res.status).toBe(401);
  });

  it("returns 403 when requester is not owner", async () => {
    mockSession();
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({ id: "m1", role: "MEMBER" } as never);
    const res = await membersDELETE(makeRequest({ userId: "user-2" }, "DELETE"), { params: makeParamsFn("t1") });
    expect(res.status).toBe(403);
  });

  it("returns 400 when userId is missing", async () => {
    mockSession();
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({ id: "m1", role: "OWNER" } as never);
    const res = await membersDELETE(makeRequest({}, "DELETE"), { params: makeParamsFn("t1") });
    expect(res.status).toBe(400);
  });

  it("returns 400 when trying to remove the team owner", async () => {
    mockSession();
    vi.mocked(prisma.teamMember.findUnique)
      .mockResolvedValueOnce({ id: "m1", role: "OWNER" } as never) // requester is owner
      .mockResolvedValueOnce({ id: "m2", role: "OWNER" } as never); // target is also owner

    const res = await membersDELETE(makeRequest({ userId: "user-2" }, "DELETE"), { params: makeParamsFn("t1") });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/cannot remove the team owner/i);
  });

  it("removes a member and returns success", async () => {
    mockSession();
    vi.mocked(prisma.teamMember.findUnique)
      .mockResolvedValueOnce({ id: "m1", role: "OWNER" } as never) // requester
      .mockResolvedValueOnce({ id: "m2", role: "MEMBER" } as never); // target
    vi.mocked(prisma.teamMember.deleteMany).mockResolvedValue({ count: 1 } as never);

    const res = await membersDELETE(makeRequest({ userId: "user-2" }, "DELETE"), { params: makeParamsFn("t1") });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(prisma.teamMember.deleteMany).toHaveBeenCalledWith({
      where: { teamId: "t1", userId: "user-2" },
    });
  });

  it("returns 500 on database error", async () => {
    mockSession();
    vi.mocked(prisma.teamMember.findUnique)
      .mockResolvedValueOnce({ id: "m1", role: "OWNER" } as never)
      .mockResolvedValueOnce({ id: "m2", role: "MEMBER" } as never);
    vi.mocked(prisma.teamMember.deleteMany).mockRejectedValue(new Error("DB error"));

    const res = await membersDELETE(makeRequest({ userId: "user-2" }, "DELETE"), { params: makeParamsFn("t1") });
    expect(res.status).toBe(500);
  });
});
