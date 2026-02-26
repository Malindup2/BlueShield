const axios = require("axios");
const { computeRiskAndAdvisory } = require("../utils/marineAdvisory");

const isFiniteNumber = (v) => typeof v === "number" && Number.isFinite(v);



/**
 * Picks the hourly index closest to "now".
 * We use this so the advisory reflects current conditions, not just the first hour returned.
 */
const pickClosestIndex = (times = []) => {
  if (!Array.isArray(times) || times.length === 0) return 0;

  const now = Date.now();
  let bestIdx = 0;
  let bestDiff = Infinity;

  for (let i = 0; i < times.length; i++) {
    const t = Date.parse(times[i]);
    if (Number.isNaN(t)) continue;

    const diff = Math.abs(t - now);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
};


/**
 * Fetch marine conditions from Open-Meteo and return a stored snapshot.
 * Includes derived riskLevel/advisory for easy UI display and reporting.
 */
exports.fetchMarineConditions = async ({ lat, lng }) => {
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
    const err = new Error("Invalid coordinates for marine API");
    err.statusCode = 400;
    throw err;
  }

  const url = "https://marine-api.open-meteo.com/v1/marine";
  const params = {
    latitude: lat,
    longitude: lng,
    hourly: "wave_height,wind_wave_height,sea_surface_temperature", 
    timezone: "UTC",
  };

  try {
    const resp = await axios.get(url, { params, timeout: 10000 });
    const data = resp.data || {};
    const hourly = data.hourly || {};

    const times = hourly.time || [];
    const idx = pickClosestIndex(times);

    const timestamp = times[idx] ?? new Date().toISOString();
    const waveHeight = hourly.wave_height?.[idx] ?? null;
    const windWaveHeight = hourly.wind_wave_height?.[idx] ?? null;
    const seaTemperature = hourly.sea_surface_temperature?.[idx] ?? null;

    const { riskLevel, advisory } = computeRiskAndAdvisory({ waveHeight, windWaveHeight });

    return {
      fetchedAt: new Date(),
      provider: "Open-Meteo Marine API",
      waveHeight,
      windWaveHeight,
      seaTemperature,
      timestamp,
      riskLevel,
      advisory,
    };
  } catch (e) {
    const err = new Error("Failed to fetch marine conditions (Open-Meteo)");
    err.statusCode = 502;
    throw err;
  }
};