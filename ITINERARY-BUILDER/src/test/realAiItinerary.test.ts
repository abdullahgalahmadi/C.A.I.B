/// <reference types="vitest" />
import { test, expect } from 'vitest';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

test('REAL Gemini API: Generates a day-by-day itinerary for Riyadh', async () => {
  const prompt = `
Create a 1-day JSON itinerary for Riyadh using this format:

{
  "Day 1": {
    "morning": { "name": "PLACE", "city": "CITY", "type": "TYPE" },
    "afternoon": { "name": "PLACE", "city": "CITY", "type": "TYPE" },
    "evening": { "name": "PLACE", "city": "CITY", "type": "TYPE" }
  }
}

Only use places that exist in Google Maps. Respond ONLY with raw JSON.
  `;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(prompt);
  const response = result.response;
  const rawText = await response.text();

  console.log("Raw Gemini Response:");
  console.log(rawText);

  console.log("Raw Gemini Response:");
console.log(rawText);

let parsed;
try {
  const cleaned = rawText.trim()
    .replace(/^```json/, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();

  parsed = JSON.parse(cleaned);
} catch (err) {
  console.error("❌ JSON parse failed");
  throw err;
}


  expect(parsed["Day 1"]).toBeDefined();
  expect(parsed["Day 1"].morning.name).toBeDefined();
  console.log("Parsed:", parsed["Day 1"]);
});
