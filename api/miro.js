const { normalizeWords, setCorsHeaders } = require("./_lib/shared");

module.exports = function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { words, result, mutation } = req.body || {};
  const conceptsForBoard = normalizeWords(words);
  if (
    !conceptsForBoard ||
    typeof result?.innovation !== "string" ||
    !result.innovation.trim()
  ) {
    return res
      .status(400)
      .json({ error: "Generate an innovation before preparing a Miro map." });
  }

  const dna = Array.isArray(result?.dna) ? result.dna : [];
  const sections = [
    { title: "IDEA DNA", content: "Three unrelated ideas. One unexpected innovation." },
    ...conceptsForBoard.flatMap((word, index) => [
      { title: `CONCEPT ${index + 1}`, content: word },
      { title: `DNA ${index + 1}`, content: dna[index]?.core_characteristic || "" },
    ]),
    { title: "HIDDEN CONNECTION", content: result?.connection || "" },
    { title: "PROBLEM", content: result?.problem || "" },
    { title: "INNOVATION", content: result?.innovation || "" },
    { title: "TARGET USERS", content: result?.target_users || "" },
    { title: "UNEXPECTED FEATURE", content: result?.unexpected_feature || "" },
    { title: "MUTATION", content: mutation?.changed_assumption || "Not generated yet" },
    { title: "EVOLVED INNOVATION", content: mutation?.evolved_innovation || "Not generated yet" },
  ];

  return res.status(200).json({
    created: false,
    integrationConfigured: false,
    message: "Your innovation map is ready for Miro.",
    board: { title: "IDEA DNA Innovation Map", sections },
  });
};
