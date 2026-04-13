import { GoogleGenAI, Type } from "@google/genai";
import { EisenhowerMatrixData } from "./types";

export async function analyzeWithGemini(
  base64Audio: string,
  mimeType: string
): Promise<EisenhowerMatrixData> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Audio,
          },
        },
        {
          text: "Analyze this voice note and extract actionable work tasks. Categorize each task into the Eisenhower Matrix: 1) Urgent and Important, 2) Important but Not Urgent, 3) Urgent but Not Important, 4) Not Urgent and Not Important. Return the result in a clean JSON format.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          urgentImportant: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Tasks that are both urgent and important",
          },
          importantNotUrgent: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Tasks that are important but not urgent",
          },
          urgentNotImportant: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Tasks that are urgent but not important",
          },
          notUrgentNotImportant: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Tasks that are neither urgent nor important",
          },
        },
        required: [
          "urgentImportant",
          "importantNotUrgent",
          "urgentNotImportant",
          "notUrgentNotImportant",
        ],
      },
    },
  });

  try {
    const text = response.text || "{}";
    return JSON.parse(text) as EisenhowerMatrixData;
  } catch {
    return emptyMatrix();
  }
}

function emptyMatrix(): EisenhowerMatrixData {
  return {
    urgentImportant: [],
    importantNotUrgent: [],
    urgentNotImportant: [],
    notUrgentNotImportant: [],
  };
}
