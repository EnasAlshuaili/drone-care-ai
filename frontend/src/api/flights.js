import apiClient from "./client.js";

export function listFlights({ droneId, limit, offset } = {}) {
  const params = {};
  if (droneId) params.drone_id = droneId;
  if (limit) params.limit = limit;
  if (offset) params.offset = offset;
  return apiClient.get("/api/v1/flights", { params }).then((res) => res.data);
}

export function getFlight(flightId) {
  return apiClient.get(`/api/v1/flights/${flightId}`).then((res) => res.data);
}

export function createFlight(flight) {
  return apiClient.post("/api/v1/flights", flight).then((res) => res.data);
}
