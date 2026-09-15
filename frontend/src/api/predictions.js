import apiClient from "./client.js";

export function listPredictions({ droneId, limit, offset } = {}) {
  const params = {};
  if (droneId) params.drone_id = droneId;
  if (limit) params.limit = limit;
  if (offset) params.offset = offset;
  return apiClient.get("/api/v1/predictions", { params }).then((res) => res.data);
}

export function getPrediction(predictionId) {
  return apiClient.get(`/api/v1/predictions/${predictionId}`).then((res) => res.data);
}

export function createPrediction(prediction) {
  return apiClient.post("/api/v1/predictions", prediction).then((res) => res.data);
}

// Feature list/order/categorical values come from the backend's central
// config (app/core/ml_config.py) rather than being hardcoded here, per
// System Specification §12.
export function getPredictionSchema() {
  return apiClient.get("/api/v1/predictions/schema").then((res) => res.data);
}
