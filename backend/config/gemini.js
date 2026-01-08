import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI;

export async function getGemini() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable not set");
    }
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}