import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDrone } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { getPrediction } from "../../api/predictions.js";
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

  if (isLoading) return <p>Loading prediction…</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!prediction) return null;

  return (
    <div>
      <p>
        <Link to="/predictions">&larr; Back to Predictions</Link>
      </p>
      <h1>Prediction — {new Date(prediction.created_at).toLocaleString()}</h1>

      <dl>
        <dt>Drone</dt>
        <dd>{drone ? <Link to={`/drones/${drone.id}`}>{drone.name}</Link> : prediction.drone_id}</dd>
        <dt>Failure probability</dt>
        <dd>{(prediction.failure_probability * 100).toFixed(1)}%</dd>
        <dt>Risk level</dt>
        <dd style={{ color: riskColor(prediction.risk_level), fontWeight: "bold" }}>
          {prediction.risk_level}
        </dd>
        <dt>Recommendation</dt>
        <dd>{riskRecommendation(prediction.risk_level)}</dd>
        <dt>Model version</dt>
        <dd>{prediction.model_version}</dd>
      </dl>

      <h2>Input telemetry</h2>
      <dl>
        {FEATURE_LABELS.map(([key, label]) => (
          <div key={key}>
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
  );
}
