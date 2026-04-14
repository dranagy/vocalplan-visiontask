import { EisenhowerMatrixData } from "../types";

const ZAI_BASE = "https://api.z.ai/api/paas/v4";

function emptyMatrix(): EisenhowerMatrixData {
  return {
    urgentImportant: [],
    importantNotUrgent: [],
    urgentNotImportant: [],
    notUrgentNotImportant: [],
  };
}

async function transcribe(
  base64Audio: string,
  mimeType: string
): Promise<string> {
  const apiKey = process.env.Z_AI_API_KEY;
  if (!apiKey) throw new Error("Z_AI_API_KEY is not set");

  // Convert base64 to a Blob-like buffer and determine file extension
  const buffer = Buffer.from(base64Audio, "base64");
  const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "mp4" : "wav";
  const filename = `audio.${ext}`;

  const formData = new FormData();
  formData.append("model", "glm-asr-2512");
  formData.append("stream", "false");
  formData.append("file", new Blob([buffer], { type: mimeType }), filename);

  const res = await fetch(`${ZAI_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`ASR request failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.text || "";
}

async function categorize(transcript: string): Promise<EisenhowerMatrixData> {
  const apiKey = process.env.Z_AI_API_KEY;
  if (!apiKey) throw new Error("Z_AI_API_KEY is not set");

  const res = await fetch(`${ZAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "glm-5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a task categorization assistant. Given a text transcript of someone describing their tasks, extract actionable work tasks and categorize each one into the Eisenhower Matrix. Return ONLY a JSON object with exactly these four keys: urgentImportant (string[]), importantNotUrgent (string[]), urgentNotImportant (string[]), notUrgentNotImportant (string[]). Do not include any other text.",
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Categorization request failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) return emptyMatrix();

  try {
    const parsed = JSON.parse(content);
    return {
      urgentImportant: Array.isArray(parsed.urgentImportant) ? parsed.urgentImportant : [],
      importantNotUrgent: Array.isArray(parsed.importantNotUrgent) ? parsed.importantNotUrgent : [],
      urgentNotImportant: Array.isArray(parsed.urgentNotImportant) ? parsed.urgentNotImportant : [],
      notUrgentNotImportant: Array.isArray(parsed.notUrgentNotImportant) ? parsed.notUrgentNotImportant : [],
    };
  } catch {
    return emptyMatrix();
  }
}

export async function analyzeWithGLM(
  base64Audio: string,
  mimeType: string
): Promise<EisenhowerMatrixData> {
  const transcript = await transcribe(base64Audio, mimeType);
  if (!transcript.trim()) return emptyMatrix();
  return categorize(transcript);
}
