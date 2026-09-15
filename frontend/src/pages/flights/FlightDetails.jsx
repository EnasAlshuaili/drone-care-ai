import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDrone } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { getFlight } from "../../api/flights.js";

// Shows the flight's own recorded fields and telemetry only — no AI failure
// prediction here yet, since that module doesn't exist until a later phase.
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

  if (isLoading) return <p>Loading flight…</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!flight) return null;

  return (
    <div>
      <p>
        <Link to="/flights">&larr; Back to Flights</Link>
      </p>
      <h1>Flight — {new Date(flight.flight_datetime).toLocaleString()}</h1>

      <h2>Flight information</h2>
      <dl>
        <dt>Drone</dt>
        <dd>{drone ? <Link to={`/drones/${drone.id}`}>{drone.name}</Link> : flight.drone_id}</dd>
        <dt>Status</dt>
        <dd>{flight.flight_status}</dd>
        <dt>Application</dt>
        <dd>{flight.application || "—"}</dd>
        <dt>Duration</dt>
        <dd>{flight.flight_duration != null ? `${flight.flight_duration} min` : "—"}</dd>
        <dt>Distance flown</dt>
        <dd>{flight.distance_flown ?? "—"}</dd>
        <dt>Payload type</dt>
        <dd>{flight.payload_type || "—"}</dd>
        <dt>Actual carry weight</dt>
        <dd>{flight.actual_carry_weight != null ? `${flight.actual_carry_weight} kg` : "—"}</dd>
        <dt>Recorded</dt>
        <dd>{new Date(flight.created_at).toLocaleString()}</dd>
      </dl>

      <h2>Telemetry</h2>
      <dl>
        <dt>Altitude</dt>
        <dd>{flight.altitude != null ? `${flight.altitude} m` : "—"}</dd>
        <dt>Battery remaining</dt>
        <dd>{flight.battery_remaining != null ? `${flight.battery_remaining}%` : "—"}</dd>
        <dt>GPS accuracy</dt>
        <dd>{flight.gps_accuracy != null ? `${flight.gps_accuracy} m` : "—"}</dd>
        <dt>Wind speed</dt>
        <dd>{flight.wind_speed ?? "—"}</dd>
        <dt>Obstacles encountered</dt>
        <dd>{flight.obstacles_encountered == null ? "—" : flight.obstacles_encountered ? "Yes" : "No"}</dd>
      </dl>
    </div>
  );
}
