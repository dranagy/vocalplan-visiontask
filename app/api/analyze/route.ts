import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeWithGemini } from "@/lib/gemini";
import { analyzeWithGLM } from "@/lib/glm";
import { EisenhowerMatrixData } from "@/types";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { base64Audio, mimeType, provider } = await request.json();

    if (!base64Audio || !mimeType || !provider) {
      return NextResponse.json(
        { error: "Missing base64Audio, mimeType, or provider" },
        { status: 400 }
      );
    }

    let data: EisenhowerMatrixData;

    if (provider === "gemini") {
      data = await analyzeWithGemini(base64Audio, mimeType);
    } else if (provider === "glm") {
      data = await analyzeWithGLM(base64Audio, mimeType);
    } else {
      return NextResponse.json(
        { error: `Unknown provider: ${provider}` },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
