import { GoogleGenAI, Type } from "@google/genai";
import { GeminiTaskResponse } from "../types";

export async function extractTasksFromImage(
  base64Image: string,
  mimeType: string = "image/png"
): Promise<GeminiTaskResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `Analyze this image of handwritten notes, whiteboard content, or sketches. Extract any items that look like tasks, project resources (people or departments), task descriptions, and deadlines.
Organize them into a structured list. If a task isn't clearly assigned to a resource, assign it to a resource named "Unassigned".
Return the data in a clean JSON format matching the schema provided.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(",")[1] || base64Image, mimeType } },
        { text: prompt },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Title of the task" },
                description: { type: Type.STRING, description: "Detailed description of the task" },
                deadline: { type: Type.STRING, description: "Task deadline if available" },
                resourceName: { type: Type.STRING, description: "The name of the resource/person assigned" },
              },
              required: ["title", "description", "deadline", "resourceName"],
            },
          },
        },
        required: ["tasks"],
      },
    },
  });

  try {
    const text = response.text || "{}";
    return JSON.parse(text) as GeminiTaskResponse;
  } catch {
    return { tasks: [] };
  }
}
