import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDrone } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { getFlight } from "../../api/flights.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { IconArrowLeft } from "../../components/icons.jsx";

const TELEMETRY_FIELDS = [
  { key: "battery_remaining", label: "Battery", suffix: "%" },
  { key: "altitude", label: "Altitude", suffix: " m" },
  { key: "distance_flown", label: "Distance flown", suffix: "" },
  { key: "wind_speed", label: "Wind speed", suffix: "" },
  { key: "gps_accuracy", label: "GPS accuracy", suffix: " m" },
];

// Shows the flight's own recorded fields and telemetry only — no AI failure
// prediction here (that's a separate module reached via Predictions).
export default function FlightDetails() {
  const { flightId } = useParams();
  const [flight, setFlight] = useState(null);
  const [drone, setDrone] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getFlight(flightId)
      .then((f) => {
        if (cancelled) return;
        setFlight(f);
        // Best-effort: the associated drone's own details (e.g. it may have
        // since been deactivated) aren't essential to showing the flight.
        return getDrone(f.drone_id)
          .then((d) => !cancelled && setDrone(d))
          .catch(() => {});
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err, "Could not load flight.")))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [flightId]);

  if (isLoading) {
    return (
      <div className="dc-page">
        <div className="dc-skeleton" style={{ height: 280 }} />
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
  if (!flight) return null;

  return (
    <div className="dc-page">
      <Link to="/flights" className="dc-link-back">
        <IconArrowLeft /> Back to Flights
      </Link>

      <div className="dc-page-header">
        <div>
          <span className="dc-eyebrow">Flight record</span>
          <h1>{new Date(flight.flight_datetime).toLocaleString()}</h1>
          <div style={{ marginTop: "0.5rem" }}>
            <StatusBadge status={flight.flight_status} kind="flight" />
          </div>
        </div>
      </div>

      <div className="dc-card" style={{ marginBottom: "1.5rem" }}>
        <div className="dc-card-header">
          <h2>Flight information</h2>
        </div>
        <dl className="dc-detail-list">
          <div className="dc-detail-item">
            <dt>Drone</dt>
            <dd>{drone ? <Link to={`/drones/${drone.id}`}>{drone.name}</Link> : flight.drone_id}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Application</dt>
            <dd>{flight.application || "—"}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Duration</dt>
            <dd>{flight.flight_duration != null ? `${flight.flight_duration} min` : "—"}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Payload type</dt>
            <dd>{flight.payload_type || "—"}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Actual carry weight</dt>
            <dd>{flight.actual_carry_weight != null ? `${flight.actual_carry_weight} kg` : "—"}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Obstacles encountered</dt>
            <dd>{flight.obstacles_encountered == null ? "—" : flight.obstacles_encountered ? "Yes" : "No"}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Recorded</dt>
            <dd>{new Date(flight.created_at).toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      <div className="dc-card">
        <div className="dc-card-header">
          <h2>Telemetry</h2>
        </div>
        <div className="dc-grid dc-grid-cards">
          {TELEMETRY_FIELDS.map(({ key, label, suffix }) => (
            <div key={key} className="dc-stat">
              <div className="dc-stat-label">{label}</div>
              <div className="dc-stat-value">{flight[key] != null ? `${flight[key]}${suffix}` : "—"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
