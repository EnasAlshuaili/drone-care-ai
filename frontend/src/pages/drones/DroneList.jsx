import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDrones } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";

const STATUS_OPTIONS = ["active", "inactive", "maintenance", "retired"];

export default function DroneList() {
  const [drones, setDrones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const fetchDrones = useCallback(async (filters) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listDrones(filters);
      setDrones(data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load drones."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrones({});
  }, [fetchDrones]);

  function handleFilterSubmit(event) {
    event.preventDefault();
    fetchDrones({ search: search || undefined, status: status || undefined });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>My Drones</h1>
        <Link to="/drones/new">
          <button>Add drone</button>
        </Link>
      </div>

      <form onSubmit={handleFilterSubmit} style={{ margin: "1rem 0", display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Search by name or serial number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button type="submit">Filter</button>
      </form>

      {isLoading && <p>Loading drones…</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!isLoading && !error && drones.length === 0 && (
        <p>No drones yet. Add your first drone to get started.</p>
      )}

      {!isLoading && !error && drones.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th>Name</th>
              <th>Serial number</th>
              <th>Manufacturer</th>
              <th>Status</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody>
            {drones.map((drone) => (
              <tr key={drone.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>
                  <Link to={`/drones/${drone.id}`}>{drone.name}</Link>
                </td>
                <td>{drone.serial_number}</td>
                <td>{drone.manufacturer || "—"}</td>
                <td>{drone.status}</td>
                <td>{drone.health_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
