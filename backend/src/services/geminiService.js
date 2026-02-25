const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyse an Illegal Fishing Case and return an AI-generated risk score (0-100)
 * along with a short justification and recommended legal actions.
 *
 * @param {Object} params
 * @param {string} params.vesselName      – name or ID of the vessel
 * @param {string} params.flagState       – flag state / origin of the vessel
 * @param {string} params.severity        – LOW | MEDIUM | HIGH | CRITICAL
 * @param {string} params.description     – free-text from the original report
 * @param {string} params.locationName    – human-readable location / address
 * @returns {Promise<{ riskScore: number, riskLevel: string, justification: string, recommendedActions: string[] }>}
 */
exports.analyseEnforcementRisk = async ({
  vesselName,
  flagState,
  severity,
  description,
  locationName,
}) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are a Maritime Law Enforcement AI for the BlueShield coastal protection system.

Analyse the following illegal fishing incident and provide a legal risk assessment.

Vessel Name: ${vesselName || "Unknown"}
Flag State (Origin): ${flagState || "Unknown"}
Admin Assessed Severity: ${severity}
Incident Description: ${description || "No description provided."}
Location: ${locationName || "Unknown"}

Respond ONLY with valid JSON using this exact structure:
{
  "riskScore": <integer 0-100>,
  "riskLevel": "<LOW | MODERATE | HIGH | CRITICAL>",
  "justification": "<2-3 sentence legal justification for the score>",
  "recommendedActions": ["<action 1>", "<action 2>"]
}

Scoring guide:
  0-25   → LOW        (Minor infraction, issue warning)
  26-50  → MODERATE   (Standard fine, inspect vessel)
  51-75  → HIGH       (Heavy fine, confiscate equipment)
  76-100 → CRITICAL   (Arrest crew, seize vessel immediately)

Base your analysis strictly on the provided enforcement data.`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    const parsed = JSON.parse(responseText);

    // Validate and clamp riskScore (0 to 100)
    const riskScore = Math.min(100, Math.max(0, Math.round(Number(parsed.riskScore) || 0)));

    const VALID_LEVELS = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
    const riskLevel = VALID_LEVELS.includes(parsed.riskLevel)
      ? parsed.riskLevel
      : deriveLevel(riskScore);

    return {
      riskScore,
      riskLevel,
      justification: String(parsed.justification || ""),
      recommendedActions: Array.isArray(parsed.recommendedActions)
        ? parsed.recommendedActions.map(String)
        : [],
    };
  } catch (e) {
    const err = new Error(`Gemini enforcement analysis failed: ${e.message}`);
    err.statusCode = 502;
    throw err;
  }
};

/** Derive a risk level from a numeric score when the model returns an invalid level. */
function deriveLevel(score) {
  if (score >= 76) return "CRITICAL";
  if (score >= 51) return "HIGH";
  if (score >= 26) return "MODERATE";
  return "LOW";
}
