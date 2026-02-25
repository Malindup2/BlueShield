
/**
 * Computes a risk level and advisory message based on marine wave conditions.
 * Uses simple, rule-based thresholds to ensure consistent and explainable results.
 */

const computeRiskAndAdvisory = ({ waveHeight, windWaveHeight }) => {

  const wh = typeof waveHeight === "number" ? waveHeight : 0;
  const wwh = typeof windWaveHeight === "number" ? windWaveHeight : 0;

  
  if (wh >= 3 || wwh >= 2) {
    return {
      riskLevel: "HIGH",
      advisory:
        "Avoid sea travel; unsafe conditions (high waves / strong wind-driven sea). Advice valid for next few hours.",
    };
  }

  if (wh >= 2 || wwh >= 1.2) {
    return {
      riskLevel: "MODERATE",
      advisory: "Caution for small fishing boats. Advice valid for next few hours.",
    };
  }

  return {
    riskLevel: "LOW",
    advisory: "Sea conditions appear normal. Advice valid for next few hours.",
  };
};

module.exports = { computeRiskAndAdvisory };