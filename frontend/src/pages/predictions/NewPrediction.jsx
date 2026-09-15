import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listDrones } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { createPrediction, getPredictionSchema } from "../../api/predictions.js";

// Maps the backend's central feature schema (GET /predictions/schema, backed
// by app/core/ml_config.PREDICTION_FEATURES) to the snake_case field names
// PredictionCreate expects. The feature set/order/categorical values
// themselves are never hardcoded here — only this fixed name translation,
// which mirrors the request schema's own field names.
const FIELD_BY_FEATURE_NAME = {
  "Obstacles Encountered": "obstacles_encountered",
  "Battery Remaining": "battery_remaining",
  "Wind Speed": "wind_speed",
  "GPS Accuracy": "gps_accuracy",
  "Actual Carry Weight": "actual_carry_weight",
  "Max Carry Weight": "max_carry_weight",
  "Propeller Count": "propeller_count",
  "Drone Size": "drone_size",
  "Distance Flown": "distance_flown",
  "Drone Model": "drone_model",
  "Payload Type": "payload_type",
  "Application": "application",
  "Altitude": "altitude",
};

const EMPTY_VALUES = {
  drone_id: "",
  obstacles_encountered: false,
  battery_remaining: "",
  wind_speed: "",
  gps_accuracy: "",
  actual_carry_weight: "",
  max_carry_weight: "",
  propeller_count: "",
  drone_size: "",
  distance_flown: "",
  drone_model: "",
  payload_type: "",
  application: "",
  altitude: "",
};

// FR-PRED-01: only fields operationally available *before* a flight are
// collected here (no flight_duration or other post-flight-only fields —
// see backend/app/schemas/prediction.py).
export default function NewPrediction() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDroneId = searchParams.get("droneId") || "";
  const preselectedFlightId = searchParams.get("flightId") || "";

  const [drones, setDrones] = useState([]);
  const [categoryValues, setCategoryValues] = useState({});
  const [values, setValues] = useState({ ...EMPTY_VALUES, drone_id: preselectedDroneId });
  const [error, setError] = useState(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    listDrones().then(setDrones).catch(() => setDrones([]));
  }, []);

  useEffect(() => {
    getPredictionSchema()
      .then((schema) => {
        const byField = {};
        for (const feature of schema.features) {
          if (feature.values) {
            byField[FIELD_BY_FEATURE_NAME[feature.name]] = feature.values;
          }
        }
        setCategoryValues(byField);
      })
      .catch(() => setError("Could not load the prediction form. Please try again."))
      .finally(() => setIsLoadingSchema(false));
  }, []);

  function handleChange(field) {
    return (event) => {
      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const prediction = await createPrediction({
        drone_id: values.drone_id,
        flight_id: preselectedFlightId || null,
        obstacles_encountered: values.obstacles_encountered,
        battery_remaining: Number(values.battery_remaining),
        wind_speed: Number(values.wind_speed),
        gps_accuracy: Number(values.gps_accuracy),
        actual_carry_weight: Number(values.actual_carry_weight),
        max_carry_weight: Number(values.max_carry_weight),
        propeller_count: Number(values.propeller_count),
        drone_size: values.drone_size,
        distance_flown: Number(values.distance_flown),
        drone_model: values.drone_model,
        payload_type: values.payload_type,
        application: values.application,
        altitude: Number(values.altitude),
      });
      navigate(`/predictions/${prediction.id}`);
    } catch (err) {
      setError(getErrorMessage(err, "Could not run prediction."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function categorySelect(field, label) {
    const options = categoryValues[field] || [];
    return (
      <div className="dc-field">
        <label className="dc-label" htmlFor={field}>
          {label} <span className="dc-required">*</span>
        </label>
        <select id={field} required className="dc-select" value={values[field]} onChange={handleChange(field)} disabled={isLoadingSchema}>
          <option value="" disabled>
            {isLoadingSchema ? "Loading…" : "Select"}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  function numberInput(field, label, { min = 0, max } = {}) {
    return (
      <div className="dc-field">
        <label className="dc-label" htmlFor={field}>
          {label} <span className="dc-required">*</span>
        </label>
        <input id={field} type="number" required min={min} max={max} step="any" className="dc-input" value={values[field]} onChange={handleChange(field)} />
      </div>
    );
  }

  return (
    <div className="dc-page">
      <div className="dc-page-header">
        <div>
          <span className="dc-eyebrow">AI Monitoring</span>
          <h1>New prediction</h1>
          <p>Enter telemetry available before or at the start of the flight. Fields only known after a flight (like flight duration) are not part of a prediction.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="dc-form dc-card" style={{ maxWidth: 560 }}>
        <div className="dc-field">
          <label className="dc-label" htmlFor="drone_id">
            Drone <span className="dc-required">*</span>
          </label>
          <select id="drone_id" required className="dc-select" value={values.drone_id} onChange={handleChange("drone_id")}>
            <option value="" disabled>
              Select a drone
            </option>
            {drones.map((drone) => (
              <option key={drone.id} value={drone.id}>
                {drone.name}
              </option>
            ))}
          </select>
        </div>

        <div className="dc-form-row">
          {categorySelect("drone_size", "Drone size")}
          {categorySelect("drone_model", "Drone model")}
        </div>
        <div className="dc-form-row">
          {categorySelect("payload_type", "Payload type")}
          {categorySelect("application", "Application")}
        </div>

        <div className="dc-form-row">
          {numberInput("propeller_count", "Propeller count", { min: 1 })}
          {numberInput("max_carry_weight", "Max carry weight (kg)", { min: 0.01 })}
        </div>
        <div className="dc-form-row">
          {numberInput("actual_carry_weight", "Actual carry weight (kg)")}
          {numberInput("altitude", "Altitude (m)")}
        </div>
        <div className="dc-form-row">
          {numberInput("distance_flown", "Distance flown")}
          {numberInput("battery_remaining", "Battery remaining (%)", { min: 0, max: 100 })}
        </div>
        <div className="dc-form-row">
          {numberInput("gps_accuracy", "GPS accuracy (m)")}
          {numberInput("wind_speed", "Wind speed")}
        </div>

        <label className="dc-checkbox-row" style={{ marginBottom: "1.25rem" }}>
          <input type="checkbox" checked={values.obstacles_encountered} onChange={handleChange("obstacles_encountered")} />
          Obstacles encountered
        </label>

        {error && <p className="dc-error-text" style={{ marginBottom: "1rem" }}>{error}</p>}

        <button type="submit" className="dc-btn dc-btn-primary" disabled={isSubmitting || isLoadingSchema}>
          {isSubmitting ? "Running prediction…" : "Run prediction"}
        </button>
      </form>
    </div>
  );
}
