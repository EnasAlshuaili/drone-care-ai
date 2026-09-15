// FastAPI error responses are either {"detail": "message"} (AppError) or
// {"detail": [{"msg": "...", "loc": [...]}, ...]} (Pydantic validation).
// Shared across every form that talks to the API so each page doesn't
// re-implement this parsing.
export function getErrorMessage(error, fallback = "Something went wrong.") {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => item.msg).join(" ");
  }
  return fallback;
}
