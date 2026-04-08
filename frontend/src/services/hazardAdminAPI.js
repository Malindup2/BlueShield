import api from "./api";

// ─── REVIEW REPORTS ───────────────────────────────────────────────────────────

export const getHazardReviewReports = async (params = {}) => {
  const { data } = await api.get("/hazards/review-reports", { params });
  return data;
};

export const getHazardReviewReportById = async (reportId) => {
  const { data } = await api.get(`/hazards/review-reports/${reportId}`);
  return data;
};

export const updateHazardReviewReportStatus = async (reportId, payload) => {
  const { data } = await api.patch(`/hazards/review-reports/${reportId}/status`, payload);
  return data;
};

// ─── HAZARD CASES ─────────────────────────────────────────────────────────────

export const createHazardFromReport = async (reportId, payload) => {
  const { data } = await api.post(`/hazards/from-report/${reportId}`, payload);
  return data;
};

export const getHazardCases = async (params = {}) => {
  const { data } = await api.get("/hazards", { params });
  return data;
};

export const getHazardCaseById = async (hazardId) => {
  const { data } = await api.get(`/hazards/${hazardId}`);
  return data;
};

export const updateHazardCase = async (hazardId, payload) => {
  const { data } = await api.patch(`/hazards/${hazardId}`, payload);
  return data;
};

export const deleteHazardCase = async (hazardId) => {
  const { data } = await api.delete(`/hazards/${hazardId}`);
  return data;
};

export const resolveHazardCase = async (hazardId, payload) => {
  const { data } = await api.patch(`/hazards/${hazardId}/resolve`, payload);
  return data;
};



export const getHazardWeatherSnapshot = async (hazardId) => {
  const { data } = await api.get(`/hazards/${hazardId}/weather`);
  return data;
};

export const getWeatherByLocation = async (payload) => {
  const { data } = await api.post(`/hazards/weather-check`, payload);
  return data;
};

// ─── ZONES ────────────────────────────────────────────────────────────────────

export const createZone = async (payload) => {
  const { data } = await api.post("/zones", payload);
  return data;
};

export const getZones = async (params = {}) => {
  const { data } = await api.get("/zones", { params });
  return data;
};

export const getZoneById = async (zoneId) => {
  const { data } = await api.get(`/zones/${zoneId}`);
  return data;
};

export const updateZone = async (zoneId, payload) => {
  const { data } = await api.patch(`/zones/${zoneId}`, payload);
  return data;
};

export const deleteZone = async (zoneId) => {
  const { data } = await api.delete(`/zones/${zoneId}`);
  return data;
};


export const getHazardDashboardSummary = async () => {
  const { data } = await api.get("/hazards/dashboard-summary");
  return data;
};


