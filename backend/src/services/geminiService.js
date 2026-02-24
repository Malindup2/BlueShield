const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyse a hazard and return an AI-generated risk score (0-100)
 * along with a short justification and recommended actions.
 *
 * @param {Object} params
 * @param {string} params.hazardCategory  
 * @param {string} params.severity       
 * @param {string} params.description     
 * @param {Object} [params.weather]       
 * @param {Object} [params.location]      
 * @returns {Promise<{ riskScore: number, riskLevel: string, justification: string, recommendedActions: string[] }>}
 */
exports.analyseHazardRisk = async ({
  hazardCategory,
  severity,
  description,
  weather = null,
  location = null,
}) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const weatherBlock = weather
    ? `Marine weather snapshot:
   - Wave height: ${weather.waveHeight ?? "N/A"} m
   - Wind-wave height: ${weather.windWaveHeight ?? "N/A"} m
   - Sea surface temperature: ${weather.seaTemperature ?? "N/A"} °C
   - Weather risk level: ${weather.riskLevel ?? "N/A"}
   - Advisory: ${weather.advisory ?? "N/A"}`
    : "No weather data available.";

  const locationBlock = location
    ? `Location: coordinates [${location.coordinates?.join(", ") ?? "unknown"}], address: ${location.address ?? "N/A"}`
    : "Location data not available.";

  const prompt = `You are a maritime safety risk analyst AI for the BlueShield coastal protection system.

Analyse the following marine hazard and provide a risk assessment.

Hazard category: ${hazardCategory}
Severity reported by observer: ${severity}
Description: ${description || "No description provided."}
${locationBlock}
${weatherBlock}

Respond ONLY with valid JSON (no markdown, no code fences) using this exact structure:
{
  "riskScore": <integer 0-100>,
  "riskLevel": "<LOW | MODERATE | HIGH | CRITICAL>",
  "justification": "<2-3 sentence justification>",
  "recommendedActions": ["<action 1>", "<action 2>", "<action 3>"]
}

Scoring guide:
  0-25   → LOW        (minimal threat)
  26-50  → MODERATE   (monitor closely)
  51-75  → HIGH       (take protective measures)
  76-100 → CRITICAL   (immediate action required)

Base your analysis on the hazard category, severity, description, weather conditions, and location.`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Parse the JSON response from Gemini
    const parsed = JSON.parse(responseText);

    // Validate and clamp riskScore
    const riskScore = Math.min(100, Math.max(0, Math.round(Number(parsed.riskScore) || 0)));

    const VALID_LEVELS = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
    const riskLevel = VALID_LEVELS.includes(parsed.riskLevel) ? parsed.riskLevel : deriveLevel(riskScore);

    return {
      riskScore,
      riskLevel,
      justification: String(parsed.justification || ""),
      recommendedActions: Array.isArray(parsed.recommendedActions)
        ? parsed.recommendedActions.map(String)
        : [],
      assessedAt: new Date(),
    };
  } catch (e) {
    const err = new Error(`Gemini risk analysis failed: ${e.message}`);
    err.statusCode = 502;
    throw err;
  }
};


function deriveLevel(score) {
  if (score >= 76) return "CRITICAL";
  if (score >= 51) return "HIGH";
  if (score >= 26) return "MODERATE";
  return "LOW";
}
