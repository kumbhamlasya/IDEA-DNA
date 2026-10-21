// Shared utilities for all Vercel serverless API functions (ESM)

// IMPORTANT: The model ID must exactly match a currently-served OpenRouter model.
// Default: google/gemma-4-31b-it:free  (15 active endpoints, confirmed free 2026-10)
// Override by setting OPENROUTER_MODEL in Vercel environment variables.
const modelId = (process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free").trim();
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
 * Map OpenRouter/provider HTTP status codes to a safe user-facing message.
 * Never leaks the actual provider error or API key details to the client.
 */
function userFacingError(httpStatus, providerCode) {
  if (!httpStatus) return "AI generation failed. Please try again.";
  if (httpStatus === 401 || httpStatus === 403)
    return "AI service authentication error. Please contact the site owner.";
  if (httpStatus === 402)
    return "AI service credit limit reached. Please contact the site owner.";
  if (httpStatus === 429)
    return "Too many requests — please wait a moment and try again.";
  if (httpStatus === 503 || providerCode === "model_not_found" || providerCode === "no_providers")
    return "The AI model is temporarily unavailable. Please try again in a few seconds.";
  return "AI generation failed. Please try again.";
}

/**
 * Call the OpenRouter API and return the parsed JSON content.
 */
export async function requestJsonFromModel(prompt) {
  const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
  if (!apiKey) {
    const error = new Error("OpenRouter API key is not configured");
    error.code = "MISSING_API_KEY";
    throw error;
  }

  const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://idea-dna.vercel.app";

  let response;
  try {
    response = await fetch(openRouterUrl, {
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
  } catch (networkError) {
    // fetch() itself threw — network failure, DNS, timeout, etc.
    const error = new Error("Network error reaching AI service");
    error.code = "NETWORK_ERROR";
    throw error;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const providerCode = payload?.error?.code ?? payload?.error?.type ?? null;
    // Log full details server-side (visible in Vercel function logs only)
    console.error("[openrouter] request failed", {
      model: modelId,
      httpStatus: response.status,
      providerCode,
      providerMessage: String(payload?.error?.message || "").slice(0, 200),
    });
    const error = new Error(userFacingError(response.status, providerCode));
    error.status = response.status;
    error.providerCode = providerCode;
    error.userFacing = true;
    throw error;
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    console.error("[openrouter] empty model response", {
      model: modelId,
      finishReason: payload?.choices?.[0]?.finish_reason,
    });
    throw new Error("The model returned an empty response. Please try again.");
  }

  try {
    return parseJsonContent(content);
  } catch (parseError) {
    console.error("[openrouter] JSON parse failed", {
      model: modelId,
      contentSnippet: content.slice(0, 200),
    });
    throw new Error("The model response could not be parsed. Please try again.");
  }
}

/**
 * Set standard CORS headers so the frontend can call these routes.
 */
export function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
