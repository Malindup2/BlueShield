import { useState, useCallback, useRef, useEffect } from "react";
import api from "../services/api";

/**
 * LANGUAGES — the 3 supported options shown in the dropdown.
 * Exported so the component can render the <select> options.
 */
export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "si", label: "සිංහල",  flag: "🇱🇰" },
  { code: "ta", label: "தமிழ்",  flag: "🇱🇰" },
];

/**
 * useTranslation — Custom React hook for translating all page text via Azure.
 *
 * @param {Object} textMap — Plain object whose values are the default English strings.
 *
 * Returns:
 *   language      — Currently selected language code ("en" | "si" | "ta")
 *   setLanguage   — Call this from the <select> onChange handler
 *   t(key)        — Returns translated string for key, falls back to English
 *   translating   — Boolean true while Azure request is in-flight
 *
 * FIXES applied:
 *
 * FIX 1 — Translation not working (language selector does nothing):
 *   The original code called setLanguageState(targetLang) only inside the
 *   try block AFTER the await. If the component re-rendered mid-flight or
 *   any subtle error occurred, language stayed "en" and t() always returned
 *   English. Fixed by calling setLanguageState(targetLang) IMMEDIATELY when
 *   setLanguage is invoked — before the async call — so the UI reflects the
 *   selected language right away and t() uses the correct branch.
 *
 * FIX 2 — Vessel data not shown after tracking (stale translation cache):
 *   After handleTrack() → fetchCase() → setCaseData(), the vessel data
 *   populates and textMap recomputes with real vessel strings (imo, owner etc).
 *   But if a non-English language was active, the `translations` object still
 *   held the OLD translated values (with empty vessel strings from before
 *   tracking). t("imoValue") returned the stale empty translation instead of
 *   the new English fallback, so nothing showed.
 *
 *   Fixed by adding a useEffect that watches [textMap, language]. Whenever
 *   textMap changes (i.e. caseData updates after tracking) AND a non-English
 *   language is active, it automatically re-runs translateAll with the fresh
 *   textMap. This keeps translations always in sync with the latest data.
 *
 * FIX 3 — Cache invalidation on textMap change:
 *   The cache key now includes a content hash of the textMap values. When
 *   vessel data arrives and textMap changes, the new cache key won't hit the
 *   old empty-vessel cache entry, so Azure is called again with the full data.
 */
export function useTranslation(textMap) {
  const [language, setLanguageState] = useState("en");
  const [translations, setTranslations] = useState({});
  const [translating, setTranslating] = useState(false);

  // Cache: keyed by "<targetLang>|<JSON of textMap values>"
  const cacheRef = useRef({});

  // Track the current language in a ref so the auto-retranslate effect
  // can read it without being a dependency of translateAll.
  const languageRef = useRef("en");

  const translateAll = useCallback(async (targetLang, currentTextMap) => {
    // English = no translation needed
    if (targetLang === "en") {
      setTranslations({});
      setLanguageState("en");
      languageRef.current = "en";
      return;
    }

    // Guard: if textMap is empty (data not loaded yet), still update the
    // language state so the selector reflects the chosen language.
    if (!currentTextMap || Object.keys(currentTextMap).length === 0) {
      setLanguageState(targetLang);
      languageRef.current = targetLang;
      return;
    }

    // FIX 1: Set language state IMMEDIATELY so t() uses the correct branch
    // even before the Azure response arrives. If translations[key] is not yet
    // populated, t() will fall back to English textMap values (still readable).
    setLanguageState(targetLang);
    languageRef.current = targetLang;

    // Build cache key from language + all current text values
    const cacheKey = targetLang + "|" + JSON.stringify(currentTextMap);

    // Return cached result if available
    if (cacheRef.current[cacheKey]) {
      setTranslations(cacheRef.current[cacheKey]);
      return;
    }

    setTranslating(true);
    try {
      const keys = Object.keys(currentTextMap);
      const values = keys.map((k) => currentTextMap[k]);

      const res = await api.post("/translate", {
        texts: values,
        targetLanguage: targetLang,
      });

      const translated = res.data.translations;

      const result = {};
      keys.forEach((k, i) => {
        result[k] = translated[i] || currentTextMap[k];
      });

      // Store in cache
      cacheRef.current[cacheKey] = result;

      setTranslations(result);
    } catch (err) {
      console.error("[useTranslation] Request failed:", err.message);
      // On failure: translations remain empty, t() falls back to English textMap
      // Language state already set above so selector stays on chosen language
    } finally {
      setTranslating(false);
    }
  }, []); // No dependencies — translateAll receives everything as parameters

  /**
   * FIX 2: Auto-retranslate when textMap content changes while a non-English
   * language is active. This handles the case where caseData updates after an
   * action (e.g. vessel tracking) and textMap gains new non-empty values that
   * need to be translated.
   *
   * We compare the current textMap JSON to what was last translated.
   * If it changed and we're not on English, re-run translateAll.
   */
  const lastTranslatedMapRef = useRef(null);

  useEffect(() => {
    const currentLang = languageRef.current;
    if (currentLang === "en") return;
    if (!textMap || Object.keys(textMap).length === 0) return;

    const currentMapJSON = JSON.stringify(textMap);

    // Only re-translate if the textMap actually changed
    if (lastTranslatedMapRef.current === currentMapJSON) return;

    lastTranslatedMapRef.current = currentMapJSON;

    // Re-run translation with the updated textMap
    translateAll(currentLang, textMap);
  }, [textMap, translateAll]);

  /**
   * setLanguage — call this from the <select> onChange handler.
   * Always passes the current textMap snapshot to translateAll.
   */
  const setLanguage = useCallback(
    (lang) => {
      // Update ref immediately for the effect
      lastTranslatedMapRef.current = JSON.stringify(textMap);
      translateAll(lang, textMap);
    },
    [textMap, translateAll]
  );

  /**
   * t(key) — returns the translated value for the given key.
   * Falls back to the English original if language is "en" or key not yet translated.
   */
  const t = useCallback(
    (key) => {
      if (language === "en" || !translations[key]) {
        return textMap[key] ?? key;
      }
      return translations[key];
    },
    [language, translations, textMap]
  );

  return { language, setLanguage, t, translating };
}