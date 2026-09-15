import apiClient from "./client.js";

export function getDashboardSummary() {
  return apiClient.get("/api/v1/analytics/summary").then((res) => res.data);
}

export function getRiskDistribution() {
  return apiClient.get("/api/v1/analytics/risk-distribution").then((res) => res.data);
}

export function getPredictionVolume({ days } = {}) {
  const params = {};
  if (days) params.days = days;
  return apiClient.get("/api/v1/analytics/prediction-volume", { params }).then((res) => res.data);
}

export function getMaintenanceStats() {
  return apiClient.get("/api/v1/analytics/maintenance-stats").then((res) => res.data);
}
