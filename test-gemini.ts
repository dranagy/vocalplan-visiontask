
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

// Load env validation
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    console.error("Invalid or missing API key in .env.local");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function testModel() {
    console.log("Testing model: gemini-3-flash-preview");
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [{ text: "Hello, are you there?" }]
            }
        });
        console.log("Success! Response:", response.text);
    } catch (error) {
        console.error("Error calling model:");
        console.error(JSON.stringify(error, null, 2));
        
        // Also try a known working model to verify key
        console.log("\nAttempting fallback to gemini-1.5-flash to verify API key...");
        try {
            const fallback = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: { parts: [{ text: "Hello" }] }
            });
            console.log("Fallback success! API Key is valid.");
        } catch (fallbackError) {
            console.error("Fallback failed. API Key might be invalid.");
             console.error(JSON.stringify(fallbackError, null, 2));
        }
    }
}

testModel();
