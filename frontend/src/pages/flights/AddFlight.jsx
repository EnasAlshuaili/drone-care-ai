import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listDrones } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { createFlight } from "../../api/flights.js";

const FLIGHT_STATUS_OPTIONS = ["completed", "aborted", "incident"];

const EMPTY_VALUES = {
  drone_id: "",
  flight_datetime: "",
  flight_status: "completed",
  application: "",
  altitude: "",
  flight_duration: "",
  distance_flown: "",
  battery_remaining: "",
  gps_accuracy: "",
  wind_speed: "",
  obstacles_encountered: false,
  payload_type: "",
  actual_carry_weight: "",
};

// FR-FLIGHT-01: logs a completed flight, including fields only known
// post-flight (e.g. flight_duration) — distinct from the AI prediction's
// pre-flight-only inputs, which is a separate, later module.
export default function AddFlight() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDroneId = searchParams.get("droneId") || "";

  const [drones, setDrones] = useState([]);
  const [values, setValues] = useState({ ...EMPTY_VALUES, drone_id: preselectedDroneId });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    listDrones().then(setDrones).catch(() => setDrones([]));
  }, []);

  function handleChange(field) {
    return (event) => {
      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));
    };
  }

  function numberOrNull(value) {
    return value === "" ? null : Number(value);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const flight = await createFlight({
        drone_id: values.drone_id,
        flight_datetime: values.flight_datetime,
        flight_status: values.flight_status,
        application: values.application || null,
        altitude: numberOrNull(values.altitude),
        flight_duration: numberOrNull(values.flight_duration),
        distance_flown: numberOrNull(values.distance_flown),
        battery_remaining: numberOrNull(values.battery_remaining),
        gps_accuracy: numberOrNull(values.gps_accuracy),
        wind_speed: numberOrNull(values.wind_speed),
        obstacles_encountered: values.obstacles_encountered,
        payload_type: values.payload_type || null,
        actual_carry_weight: numberOrNull(values.actual_carry_weight),
      });
      navigate(`/flights/${flight.id}`);
    } catch (err) {
      setError(getErrorMessage(err, "Could not save flight."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dc-page">
      <div className="dc-page-header">
        <div>
          <span className="dc-eyebrow">Telemetry</span>
          <h1>Add flight</h1>
          <p>Log a completed flight and its telemetry.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="dc-form dc-card" style={{ maxWidth: 520 }}>
        <div className="dc-form-row">
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

          <div className="dc-field">
            <label className="dc-label" htmlFor="flight_status">
              Flight status <span className="dc-required">*</span>
            </label>
            <select id="flight_status" required className="dc-select" value={values.flight_status} onChange={handleChange("flight_status")}>
              {FLIGHT_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="dc-field">
          <label className="dc-label" htmlFor="flight_datetime">
            Flight date/time <span className="dc-required">*</span>
          </label>
          <input
            id="flight_datetime"
            type="datetime-local"
            required
            className="dc-input"
            value={values.flight_datetime}
            onChange={handleChange("flight_datetime")}
          />
        </div>

        <div className="dc-field">
          <label className="dc-label" htmlFor="application">
            Application
          </label>
          <input
            id="application"
            type="text"
            maxLength={50}
            placeholder="e.g. Survey, Delivery, Inspection"
            className="dc-input"
            value={values.application}
            onChange={handleChange("application")}
          />
        </div>

        <div className="dc-form-row">
          <div className="dc-field">
            <label className="dc-label" htmlFor="altitude">
              Altitude (m)
            </label>
            <input id="altitude" type="number" min="0" step="any" className="dc-input" value={values.altitude} onChange={handleChange("altitude")} />
          </div>
          <div className="dc-field">
            <label className="dc-label" htmlFor="flight_duration">
              Duration (min)
            </label>
            <input
              id="flight_duration"
              type="number"
              min="0"
              step="any"
              className="dc-input"
              value={values.flight_duration}
              onChange={handleChange("flight_duration")}
            />
          </div>
        </div>

        {/* Unit intentionally not labeled: the Data Dictionary marks distance_flown's
            unit as TBD (m or km) — see Phase 4 report, Provisional Decisions. */}
        <div className="dc-form-row">
          <div className="dc-field">
            <label className="dc-label" htmlFor="distance_flown">
              Distance flown
            </label>
            <input
              id="distance_flown"
              type="number"
              min="0"
              step="any"
              className="dc-input"
              value={values.distance_flown}
              onChange={handleChange("distance_flown")}
            />
          </div>
          <div className="dc-field">
            <label className="dc-label" htmlFor="battery_remaining">
              Battery remaining (%)
            </label>
            <input
              id="battery_remaining"
              type="number"
              min="0"
              max="100"
              step="any"
              className="dc-input"
              value={values.battery_remaining}
              onChange={handleChange("battery_remaining")}
            />
          </div>
        </div>

        {/* Unit intentionally not labeled: wind_speed's unit is also marked TBD
            (km/h or m/s) in the Data Dictionary. */}
        <div className="dc-form-row">
          <div className="dc-field">
            <label className="dc-label" htmlFor="gps_accuracy">
              GPS accuracy (m)
            </label>
            <input id="gps_accuracy" type="number" min="0" step="any" className="dc-input" value={values.gps_accuracy} onChange={handleChange("gps_accuracy")} />
          </div>
          <div className="dc-field">
            <label className="dc-label" htmlFor="wind_speed">
              Wind speed
            </label>
            <input id="wind_speed" type="number" min="0" step="any" className="dc-input" value={values.wind_speed} onChange={handleChange("wind_speed")} />
          </div>
        </div>

        <div className="dc-form-row">
          <div className="dc-field">
            <label className="dc-label" htmlFor="payload_type">
              Payload type
            </label>
            <input id="payload_type" type="text" maxLength={50} className="dc-input" value={values.payload_type} onChange={handleChange("payload_type")} />
          </div>
          <div className="dc-field">
            <label className="dc-label" htmlFor="actual_carry_weight">
              Actual carry weight (kg)
            </label>
            <input
              id="actual_carry_weight"
              type="number"
              min="0"
              step="any"
              className="dc-input"
              value={values.actual_carry_weight}
              onChange={handleChange("actual_carry_weight")}
            />
          </div>
        </div>

        <label className="dc-checkbox-row" style={{ marginBottom: "1.25rem" }}>
          <input type="checkbox" checked={values.obstacles_encountered} onChange={handleChange("obstacles_encountered")} />
          Obstacles encountered
        </label>

        {error && <p className="dc-error-text" style={{ marginBottom: "1rem" }}>{error}</p>}

        <button type="submit" className="dc-btn dc-btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Add flight"}
        </button>
      </form>
    </div>
  );
}
