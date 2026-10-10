const { setCorsHeaders } = require("./_lib/shared");

const concepts = [
  { domain: "nature", words: ["Volcano", "Coral reef", "Mushroom", "Migration"] },
  { domain: "media", words: ["Netflix", "Podcast", "Jazz", "Comic book"] },
  { domain: "mobility", words: ["Bicycle", "Submarine", "Skateboard", "Satellite"] },
  { domain: "science", words: ["Microscope", "Gravity", "Antimatter", "Telescope"] },
  { domain: "food", words: ["Sourdough", "Tea ceremony", "Food truck", "Fermentation"] },
  { domain: "society", words: ["Library", "Time bank", "Public park", "Auction"] },
  { domain: "technology", words: ["Blockchain", "Solar panel", "Robot arm", "Mesh network"] },
  { domain: "craft", words: ["Origami", "Pottery wheel", "Loom", "Stop-motion"] },
  { domain: "sport", words: ["Curling", "Marathon", "Rock climbing", "Chess"] },
  { domain: "weather", words: ["Monsoon", "Northern lights", "Drought", "Fog"] },
  { domain: "commerce", words: ["Vending machine", "Co-op", "Subscription", "Marketplace"] },
  { domain: "architecture", words: ["Aqueduct", "Greenhouse", "Treehouse", "Floating city"] },
];

module.exports = function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const shuffled = [...concepts];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  const words = shuffled
    .slice(0, 3)
    .map(({ words: options }) => options[Math.floor(Math.random() * options.length)]);

  return res.status(200).json({ words });
};
