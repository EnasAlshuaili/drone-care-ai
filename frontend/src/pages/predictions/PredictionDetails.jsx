import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDrone } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { getPrediction } from "../../api/predictions.js";
import { IconArrowLeft } from "../../components/icons.jsx";
import { riskColor, riskRecommendation } from "./riskLevel.js";

// input_features keys are exactly PredictionCreate's field names (see
// prediction_service.create_prediction) — this only supplies display labels,
// in the same order as app/core/ml_config.PREDICTION_FEATURES.
const FEATURE_LABELS = [
  ["obstacles_encountered", "Obstacles encountered"],
  ["battery_remaining", "Battery remaining (%)"],
  ["wind_speed", "Wind speed"],
  ["gps_accuracy", "GPS accuracy (m)"],
  ["actual_carry_weight", "Actual carry weight (kg)"],
  ["max_carry_weight", "Max carry weight (kg)"],
  ["propeller_count", "Propeller count"],
  ["drone_size", "Drone size"],
  ["distance_flown", "Distance flown"],
  ["drone_model", "Drone model"],
  ["payload_type", "Payload type"],
  ["application", "Application"],
  ["altitude", "Altitude (m)"],
];

// FR-PRED-03: shows the drone, failure probability, risk level, and a
// recommendation immediately after submission (reached via navigate() from
// NewPrediction), and also whenever revisited later from Prediction History.
export default function PredictionDetails() {
  const { predictionId } = useParams();
  const [prediction, setPrediction] = useState(null);
  const [drone, setDrone] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getPrediction(predictionId)
      .then((p) => {
        if (cancelled) return;
        setPrediction(p);
        return getDrone(p.drone_id)
          .then((d) => !cancelled && setDrone(d))
          .catch(() => {});
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err, "Could not load prediction.")))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [predictionId]);

  if (isLoading) {
    return (
      <div className="dc-page">
        <div className="dc-skeleton" style={{ height: 320 }} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="dc-page">
        <p className="dc-error-text">{error}</p>
      </div>
    );
  }
  if (!prediction) return null;

  const probabilityPct = prediction.failure_probability * 100;
  const color = riskColor(prediction.risk_level);

  return (
    <div className="dc-page">
      <Link to="/predictions" className="dc-link-back">
        <IconArrowLeft /> Back to Predictions
      </Link>

      <div className="dc-card" style={{ marginBottom: "1.5rem" }}>
        <div className="dc-result-hero">
          <div className="dc-result-eyebrow">AI Failure Prediction</div>
          <div className="dc-result-risk" style={{ color }}>
            {prediction.risk_level} RISK
          </div>
          <div className="dc-result-prob" style={{ color }}>
            {probabilityPct.toFixed(1)}%
          </div>
          <p style={{ marginTop: "0.25rem" }}>Failure probability</p>
          <div className="dc-progress-track">
            <div className="dc-progress-fill" style={{ width: `${probabilityPct}%`, background: color }} />
          </div>
          <p style={{ marginTop: "1.25rem", maxWidth: 420, marginInline: "auto" }}>{riskRecommendation(prediction.risk_level)}</p>
        </div>
      </div>

      <div className="dc-card" style={{ marginBottom: "1.5rem" }}>
        <div className="dc-card-header">
          <h2>Prediction details</h2>
        </div>
        <dl className="dc-detail-list">
          <div className="dc-detail-item">
            <dt>Drone</dt>
            <dd>{drone ? <Link to={`/drones/${drone.id}`}>{drone.name}</Link> : prediction.drone_id}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Timestamp</dt>
            <dd>{new Date(prediction.created_at).toLocaleString()}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Model version</dt>
            <dd style={{ fontSize: "0.82rem" }}>{prediction.model_version}</dd>
          </div>
        </dl>
      </div>

      <div className="dc-card">
        <div className="dc-card-header">
          <h2>Input telemetry</h2>
        </div>
        <dl className="dc-detail-list">
          {FEATURE_LABELS.map(([key, label]) => (
            <div key={key} className="dc-detail-item">
              <dt>{label}</dt>
              <dd>
                {typeof prediction.input_features[key] === "boolean"
                  ? prediction.input_features[key]
                    ? "Yes"
                    : "No"
                  : prediction.input_features[key]}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
