import apiClient from "./client.js";

export function listDrones({ search, status } = {}) {
  const params = {};
  if (search) params.search = search;
  if (status) params.status = status;
  return apiClient.get("/api/v1/drones", { params }).then((res) => res.data);
}

export function getDrone(droneId) {
  return apiClient.get(`/api/v1/drones/${droneId}`).then((res) => res.data);
}

export function createDrone(drone) {
  return apiClient.post("/api/v1/drones", drone).then((res) => res.data);
}

export function updateDrone(droneId, drone) {
  return apiClient.put(`/api/v1/drones/${droneId}`, drone).then((res) => res.data);
}

export function deactivateDrone(droneId) {
  return apiClient.delete(`/api/v1/drones/${droneId}`).then((res) => res.data);
}
