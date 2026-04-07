import api from "./api";

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export const getPendingReports = () => api.get("/illegal-cases/reports/pending");

export const markReportAsReviewed = (reportId) =>
  api.patch(`/illegal-cases/reports/${reportId}/mark-reviewed`);

export const deleteReviewedCase = (reportId) =>
  api.delete(`/illegal-cases/reports/${reportId}`);

// ─── OFFICERS ─────────────────────────────────────────────────────────────────

export const getOfficers = () => api.get("/illegal-cases/officers");

// ─── CASE RECORDS ─────────────────────────────────────────────────────────────

export const createCaseRecord = (reportId, data) =>
  api.post(`/illegal-cases/reports/${reportId}/review`, data);

export const listCaseRecords = (params = {}) =>
  api.get("/illegal-cases", { params });

export const getCaseRecordById = (caseId) =>
  api.get(`/illegal-cases/${caseId}`);

export const updateCaseRecord = (caseId, data) =>
  api.patch(`/illegal-cases/${caseId}`, data);

export const deleteCaseRecord = (caseId) =>
  api.delete(`/illegal-cases/${caseId}`);

// ─── ACTIONS ──────────────────────────────────────────────────────────────────

export const escalateCase = (caseId, officerId) =>
  api.post(`/illegal-cases/${caseId}/escalate`, { officerId });

export const resolveCase = (caseId) =>
  api.post(`/illegal-cases/${caseId}/resolve`);

export const trackVessel = (caseId) =>
  api.post(`/illegal-cases/${caseId}/track`);

export const addNote = (caseId, content) =>
  api.post(`/illegal-cases/${caseId}/notes`, { content });