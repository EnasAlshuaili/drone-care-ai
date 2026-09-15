import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listDrones } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { listFlights } from "../../api/flights.js";

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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Flights</h1>
        <Link to={droneId ? `/flights/new?droneId=${droneId}` : "/flights/new"}>
          <button>Add flight</button>
        </Link>
      </div>

      <div style={{ margin: "1rem 0" }}>
        <label htmlFor="droneFilter">Drone: </label>
        <select id="droneFilter" value={droneId} onChange={handleDroneFilterChange}>
          <option value="">All my drones</option>
          {drones.map((drone) => (
            <option key={drone.id} value={drone.id}>
              {drone.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p>Loading flights…</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!isLoading && !error && flights.length === 0 && (
        <p>No flights recorded yet. Add your first flight to get started.</p>
      )}

      {!isLoading && !error && flights.length > 0 && (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th>Date/time</th>
                <th>Drone</th>
                <th>Status</th>
                <th>Duration (min)</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((flight) => (
                <tr key={flight.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>
                    <Link to={`/flights/${flight.id}`}>
                      {new Date(flight.flight_datetime).toLocaleString()}
                    </Link>
                  </td>
                  <td>{droneName(flight.drone_id)}</td>
                  <td>{flight.flight_status}</td>
                  <td>{flight.flight_duration ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
              Previous
            </button>
            <span>
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <button disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
