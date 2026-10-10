const { normalizeWords, requestJsonFromModel, setCorsHeaders } = require("./_lib/shared");

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const originalIdea =
    typeof req.body?.originalIdea === "string"
      ? req.body.originalIdea.trim()
      : "";
  const words = normalizeWords(req.body?.words);

  if (!originalIdea || originalIdea.length > 5000 || !words) {
    return res
      .status(400)
      .json({ error: "An original idea and exactly 3 concepts are required." });
  }

  const prompt = `Evolve the innovation below by changing exactly ONE fundamental assumption. Choose an assumption that materially changes how the idea works, then explain the resulting second-generation innovation. Keep the result practical and distinct from generation 1.

Original innovation: ${originalIdea}
Source concepts: ${words.join(", ")}

Return only this JSON shape with concise string values:
{"changed_assumption":"","mutation":"","evolved_innovation":"","why_it_is_different":""}`;

  try {
    const data = await requestJsonFromModel(prompt);
    return res.status(200).json(data);
  } catch (error) {
    console.error("mutate error", {
      status: error.status,
      code: error.providerCode || error.code,
      message: String(error.message || "").slice(0, 240),
    });
    return res.status(502).json({ error: "AI generation failed. Please try again." });
  }
};
