import apiClient from "./client.js";

export function register({ fullName, email, password, passwordConfirm }) {
  return apiClient
    .post("/api/v1/auth/register", {
      full_name: fullName,
      email,
      password,
      password_confirm: passwordConfirm,
    })
    .then((res) => res.data);
}

export function login({ email, password }) {
  return apiClient.post("/api/v1/auth/login", { email, password }).then((res) => res.data);
}

export function logout() {
  return apiClient.post("/api/v1/auth/logout").then((res) => res.data);
}

export function getCurrentUser() {
  return apiClient.get("/api/v1/auth/me").then((res) => res.data);
}
