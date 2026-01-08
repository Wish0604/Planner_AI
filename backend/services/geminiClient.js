import { getGemini } from "../config/gemini.js";
import { modelConfig } from "../config/models.js";

export async function callGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set");
  }

  const genAI = await getGemini();
  const modelName = modelConfig.providers.gemini.model || "gemini-2.0-flash";
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
