const axios = require("axios");

/**
 * POST /api/translate
 * Body: { texts: ["hello", "world"], targetLanguage: "si" }
 *
 * Proxies translation requests to Azure Cognitive Services Translator.
 * The Azure API key lives only on the server (.env) and is never sent to the browser.
 *
 * Supported language codes:
 *   "en" = English (default — texts returned as-is, no Azure call made)
 *   "si" = Sinhala
 *   "ta" = Tamil
 */
exports.translate = async (req, res) => {
  try {
    const { texts, targetLanguage } = req.body;

    // Validate inputs
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ message: "texts array is required" });
    }
    if (!targetLanguage) {
      return res.status(400).json({ message: "targetLanguage is required" });
    }

    // English — return original texts immediately, no Azure call needed
    if (targetLanguage === "en") {
      return res.json({ translations: texts });
    }

    // Only allow the 3 supported languages
    const ALLOWED_LANGUAGES = ["en", "si", "ta"];
    if (!ALLOWED_LANGUAGES.includes(targetLanguage)) {
      return res
        .status(400)
        .json({ message: "Unsupported language. Allowed values: en, si, ta" });
    }

    // Read Azure credentials from environment variables
    const apiKey = process.env.AZURE_TRANSLATOR_KEY;
    const location = process.env.AZURE_TRANSLATOR_LOCATION;
    const endpoint =
      process.env.AZURE_TRANSLATOR_ENDPOINT ||
      "https://api.cognitive.microsofttranslator.com";

    if (!apiKey || !location) {
      console.error(
        "[Translate] Missing AZURE_TRANSLATOR_KEY or AZURE_TRANSLATOR_LOCATION in .env"
      );
      return res
        .status(500)
        .json({ message: "Translation service not configured on server" });
    }

    // Azure expects an array of { text: "..." } objects
    const requestBody = texts.map((t) => ({ text: t || "" }));

    const response = await axios.post(
      `${endpoint}/translate`,
      requestBody,
      {
        params: {
          "api-version": "3.0",
          from: "en",
          to: targetLanguage,
        },
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
          "Ocp-Apim-Subscription-Region": location,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    // Azure response format: [{ translations: [{ text: "...", to: "si" }] }, ...]
    const translatedTexts = response.data.map((item) => {
      return item.translations?.[0]?.text || "";
    });

    return res.json({ translations: translatedTexts });
  } catch (error) {
    console.error(
      "[Translate] Azure API error:",
      error.response?.data || error.message
    );

    if (error.response?.status === 401) {
      return res
        .status(500)
        .json({ message: "Invalid Azure Translator API key" });
    }
    if (error.response?.status === 429) {
      return res
        .status(429)
        .json({ message: "Translation quota exceeded. Please try again later." });
    }

    return res.status(500).json({
      message: "Translation failed. Please try again.",
      detail: error.response?.data || error.message,
    });
  }
};