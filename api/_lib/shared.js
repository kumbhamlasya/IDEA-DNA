// Shared utilities for all Vercel serverless API functions (ESM)

const modelId = (process.env.OPENROUTER_MODEL || "qwen/qwen3-8b:free").trim();
const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Validate and normalize the `words` array from a request body.
 * Returns a trimmed 3-element string array or null if invalid.
 */
export function normalizeWords(value) {
  if (!Array.isArray(value) || value.length !== 3) return null;
  if (
    value.some(
      (word) =>
        typeof word !== "string" || !word.trim() || word.trim().length > 80
    )
  ) {
    return null;
  }
  return value.map((word) => word.trim());
}

/**
 * Strip markdown fences from a model response and parse the JSON.
 */
function parseJsonContent(content) {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const jsonText =
    firstBrace >= 0 && lastBrace > firstBrace
      ? cleaned.slice(firstBrace, lastBrace + 1)
      : cleaned;
  return JSON.parse(jsonText);
}

/**
 * Call the OpenRouter API and return the parsed JSON content.
 */
export async function requestJsonFromModel(prompt) {
  const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
  if (!apiKey) {
    const error = new Error("OpenRouter is not configured");
    error.code = "MISSING_API_KEY";
    throw error;
  }

  const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://idea-dna.vercel.app";

  const response = await fetch(openRouterUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": siteUrl,
      "X-Title": "IDEA DNA",
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        {
          role: "system",
          content:
            "You are IDEA DNA, an expert innovation strategist. Follow the user's schema exactly and return only valid JSON. Do not wrap it in markdown.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 1800,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error("OpenRouter request failed");
    error.status = response.status;
    error.providerCode = payload?.error?.code;
    throw error;
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("The model returned an empty response");
  }
  return parseJsonContent(content);
}

/**
 * Set standard CORS headers so the frontend can call these routes.
 */
export function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
