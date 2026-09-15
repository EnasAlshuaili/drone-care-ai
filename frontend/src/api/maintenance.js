import apiClient from "./client.js";

export function listMaintenance({ droneId, limit, offset } = {}) {
  const params = {};
  if (droneId) params.drone_id = droneId;
  if (limit) params.limit = limit;
  if (offset) params.offset = offset;
  return apiClient.get("/api/v1/maintenance", { params }).then((res) => res.data);
}

export function getMaintenance(maintenanceId) {
  return apiClient.get(`/api/v1/maintenance/${maintenanceId}`).then((res) => res.data);
}

export function createMaintenance(record) {
  return apiClient.post("/api/v1/maintenance", record).then((res) => res.data);
}

export function updateMaintenance(maintenanceId, record) {
  return apiClient.put(`/api/v1/maintenance/${maintenanceId}`, record).then((res) => res.data);
}
