import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../app/api/analyze/route";
import { NextRequest } from "next/server";

vi.mock("../../lib/gemini", () => ({
  analyzeWithGemini: vi.fn(),
}));

vi.mock("../../lib/glm", () => ({
  analyzeWithGLM: vi.fn(),
}));

import { analyzeWithGemini } from "../../lib/gemini";
import { analyzeWithGLM } from "../../lib/glm";

const mockMatrix = {
  urgentImportant: ["Task 1"],
  importantNotUrgent: ["Task 2"],
  urgentNotImportant: [],
  notUrgentNotImportant: [],
};

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when fields are missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for unknown provider", async () => {
    const res = await POST(
      makeRequest({ base64Audio: "abc", mimeType: "audio/webm", provider: "unknown" })
    );
    expect(res.status).toBe(400);
  });

  it("calls Gemini and returns matrix data", async () => {
    vi.mocked(analyzeWithGemini).mockResolvedValue(mockMatrix);
    const res = await POST(
      makeRequest({ base64Audio: "abc", mimeType: "audio/webm", provider: "gemini" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.urgentImportant).toEqual(["Task 1"]);
    expect(analyzeWithGemini).toHaveBeenCalledWith("abc", "audio/webm");
  });

  it("calls GLM and returns matrix data", async () => {
    vi.mocked(analyzeWithGLM).mockResolvedValue(mockMatrix);
    const res = await POST(
      makeRequest({ base64Audio: "abc", mimeType: "audio/webm", provider: "glm" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.importantNotUrgent).toEqual(["Task 2"]);
    expect(analyzeWithGLM).toHaveBeenCalledWith("abc", "audio/webm");
  });

  it("returns 500 when provider throws", async () => {
    vi.mocked(analyzeWithGemini).mockRejectedValue(new Error("API down"));
    const res = await POST(
      makeRequest({ base64Audio: "abc", mimeType: "audio/webm", provider: "gemini" })
    );
    expect(res.status).toBe(500);
  });
});
