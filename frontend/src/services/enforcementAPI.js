import api from "./api";

// STATISTICS
export const getBasicStats = async () => {
  const { data } = await api.get("/enforcements/stats/basic");
  return data;
};

export const getStatsByDateRange = async (params) => {
  const { data } = await api.get("/enforcements/stats/by-date", { params });
  return data;
};

// CRUD
export const getEnforcements = async (params) => {
  const { data } = await api.get("/enforcements", { params });
  return data;
};

export const getEnforcementById = async (id) => {
  const { data } = await api.get(`/enforcements/${id}`);
  return data;
};

export const createEnforcementFromCase = async (caseId) => {
  const { data } = await api.post(`/enforcements/from-case/${caseId}`);
  return data;
};

export const updateEnforcement = async (id, payload) => {
  const { data } = await api.patch(`/enforcements/${id}`, payload);
  return data;
};

export const closeEnforcement = async (id, payload) => {
  const { data } = await api.patch(`/enforcements/${id}/close`, payload);
  return data;
};

// ACTIONS
export const addAction = async (id, payload) => {
  const { data } = await api.post(`/enforcements/${id}/actions`, payload);
  return data;
};

// EVIDENCE
export const getEvidence = async (id) => {
  const { data } = await api.get(`/enforcements/${id}/evidence`);
  return data;
};

export const uploadEvidence = async (id, formData) => {
  const { data } = await api.post(`/enforcements/${id}/evidence`, formData);
  return data;
};

export const updateEvidence = async (id, evidenceId, formData) => {
  const { data } = await api.patch(`/enforcements/${id}/evidence/${evidenceId}`, formData);
  return data;
};

export const deleteEvidence = async (id, evidenceId) => {
  const { data } = await api.delete(`/enforcements/${id}/evidence/${evidenceId}`);
  return data;
};

// TEAM
export const getTeamOfficers = async () => {
  const { data } = await api.get(`/enforcements/team/officers`);
  return data;
};

export const getTeam = async (id) => {
  const { data } = await api.get(`/enforcements/${id}/team`);
  return data;
};

export const addTeamMember = async (id, payload) => {
  const { data } = await api.post(`/enforcements/${id}/team`, payload);
  return data;
};

export const updateTeamMember = async (id, memberId, payload) => {
  const { data } = await api.patch(`/enforcements/${id}/team/${memberId}`, payload);
  return data;
};

export const removeTeamMember = async (id, memberId) => {
  const { data } = await api.delete(`/enforcements/${id}/team/${memberId}`);
  return data;
};

// AI RISK
export const generateRiskScore = async (id) => {
  const { data } = await api.post(`/enforcements/${id}/risk-score`);
  return data;
};
