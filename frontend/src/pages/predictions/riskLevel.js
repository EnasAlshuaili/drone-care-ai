// Shared risk-level presentation helpers for the Predictions pages. Risk
// level itself is always computed server-side (app/core/ml_config.classify_risk)
// — this only maps that value to display color/copy, per System Specification
// §28 principle 12 (don't claim more than is actually implemented).
const RISK_COLORS = {
  LOW: "#2e7d32",
  MEDIUM: "#b26a00",
  HIGH: "#c62828",
};

const RISK_RECOMMENDATIONS = {
  LOW: "Low failure risk. No immediate action required.",
  MEDIUM: "Elevated failure risk. Consider inspecting the drone before flight.",
  HIGH: "High failure risk. Inspect the drone before flight.",
};

export function riskColor(riskLevel) {
  return RISK_COLORS[riskLevel] || "inherit";
}

export function riskRecommendation(riskLevel) {
  return RISK_RECOMMENDATIONS[riskLevel] || "";
}
