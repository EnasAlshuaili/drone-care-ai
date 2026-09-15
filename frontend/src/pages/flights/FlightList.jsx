import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listDrones } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { listFlights } from "../../api/flights.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { IconFlight } from "../../components/icons.jsx";

const PAGE_SIZE = 20;

// Global "Flights" list (optionally narrowed to one drone via ?droneId=,
// e.g. when reached from Drone Details — see FlightList's "View Flights"
// link on that page). Sorted date-descending, per FR-FLIGHT-02.
export default function FlightList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const droneId = searchParams.get("droneId") || "";
  const [offset, setOffset] = useState(0);

  const [drones, setDrones] = useState([]);
  const [flights, setFlights] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listDrones().then(setDrones).catch(() => setDrones([]));
  }, []);

  const fetchFlights = useCallback(() => {
    setIsLoading(true);
    setError(null);
    return listFlights({ droneId: droneId || undefined, limit: PAGE_SIZE, offset })
      .then((data) => {
        setFlights(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load flights.")))
      .finally(() => setIsLoading(false));
  }, [droneId, offset]);

  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]);

  function handleDroneFilterChange(event) {
    const value = event.target.value;
    setOffset(0);
    setSearchParams(value ? { droneId: value } : {});
  }

  const droneName = (id) => drones.find((d) => d.id === id)?.name || id;

  return (
    <div className="dc-page">
      <div className="dc-page-header">
        <div>
          <span className="dc-eyebrow">Telemetry</span>
          <h1>Flights</h1>
          <p>Flight history and recorded telemetry for your fleet.</p>
        </div>
        <div className="dc-actions">
          <Link to={droneId ? `/flights/new?droneId=${droneId}` : "/flights/new"} className="dc-btn dc-btn-primary">
            + Add flight
          </Link>
        </div>
      </div>

      <div className="dc-card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <label className="dc-label" htmlFor="droneFilter" style={{ marginRight: "0.75rem" }}>
          Drone
        </label>
        <select id="droneFilter" className="dc-select" style={{ width: 240, display: "inline-block" }} value={droneId} onChange={handleDroneFilterChange}>
          <option value="">All my drones</option>
          {drones.map((drone) => (
            <option key={drone.id} value={drone.id}>
              {drone.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <div className="dc-skeleton" style={{ height: 220 }} />}
      {error && <p className="dc-error-text">{error}</p>}

      {!isLoading && !error && flights.length === 0 && (
        <div className="dc-card dc-state">
          <div className="dc-state-icon">
            <IconFlight />
          </div>
          <h2 style={{ fontSize: "1.1rem" }}>No flights recorded yet</h2>
          <p>Add your first flight to get started.</p>
        </div>
      )}

      {!isLoading && !error && flights.length > 0 && (
        <>
          <div className="dc-table-wrap">
            <table className="dc-table">
              <thead>
                <tr>
                  <th>Date/time</th>
                  <th>Drone</th>
                  <th>Status</th>
                  <th>Duration (min)</th>
                </tr>
              </thead>
              <tbody>
                {flights.map((flight) => (
                  <tr key={flight.id}>
                    <td>
                      <Link to={`/flights/${flight.id}`}>{new Date(flight.flight_datetime).toLocaleString()}</Link>
                    </td>
                    <td className="dc-muted">{droneName(flight.drone_id)}</td>
                    <td>
                      <StatusBadge status={flight.flight_status} kind="flight" />
                    </td>
                    <td className="dc-muted">{flight.flight_duration ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button className="dc-btn dc-btn-secondary dc-btn-sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
              Previous
            </button>
            <span className="dc-muted" style={{ fontSize: "0.85rem" }}>
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <button className="dc-btn dc-btn-secondary dc-btn-sm" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
