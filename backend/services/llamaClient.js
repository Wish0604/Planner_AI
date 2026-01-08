import axios from "axios";

const LLAMA_ENDPOINT = process.env.LLAMA_ENDPOINT;
const LLAMA_API_KEY = process.env.LLAMA_API_KEY;
const LLAMA_MODEL = process.env.LLAMA_MODEL || "llama-3";

// Returns string content or null on failure (so caller can fallback)
export async function callLlama(messages) {
  if (!LLAMA_ENDPOINT) return null;

  try {
    const res = await axios.post(
      LLAMA_ENDPOINT,
      {
        model: LLAMA_MODEL,
        messages,
        temperature: 0.2
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LLAMA_API_KEY}`
        },
        timeout: 20000
      }
    );

    return res.data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error("⚠️ Llama failed → fallback to Gemini", err.message);
    return null;
  }
}
