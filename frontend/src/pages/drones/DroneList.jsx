import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDrones } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { IconDrone, IconSearch } from "../../components/icons.jsx";

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
    <div className="dc-page">
      <div className="dc-page-header">
        <div>
          <span className="dc-eyebrow">Fleet</span>
          <h1>My Drones</h1>
          <p>Manage and monitor every drone in your fleet.</p>
        </div>
        <div className="dc-actions">
          <Link to="/drones/new" className="dc-btn dc-btn-primary">
            + Add drone
          </Link>
        </div>
      </div>

      <form onSubmit={handleFilterSubmit} className="dc-card" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem", padding: "1rem" }}>
        <div className="dc-input-icon-wrap" style={{ flex: "1 1 220px" }}>
          <span className="dc-input-icon">
            <IconSearch />
          </span>
          <input
            type="text"
            className="dc-input"
            placeholder="Search by name or serial number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="dc-select" style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button type="submit" className="dc-btn dc-btn-secondary">
          Filter
        </button>
      </form>

      {isLoading && <div className="dc-skeleton" style={{ height: 220 }} />}
      {error && <p className="dc-error-text">{error}</p>}

      {!isLoading && !error && drones.length === 0 && (
        <div className="dc-card dc-state">
          <div className="dc-state-icon">
            <IconDrone />
          </div>
          <h2 style={{ fontSize: "1.1rem" }}>No drones found</h2>
          <p>Add your first drone to get started, or adjust your filters.</p>
          <Link to="/drones/new" className="dc-btn dc-btn-primary" style={{ marginTop: "0.5rem" }}>
            Add drone
          </Link>
        </div>
      )}

      {!isLoading && !error && drones.length > 0 && (
        <div className="dc-table-wrap">
          <table className="dc-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Serial number</th>
                <th>Manufacturer</th>
                <th>Status</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              {drones.map((drone) => (
                <tr key={drone.id}>
                  <td>
                    <Link to={`/drones/${drone.id}`}>{drone.name}</Link>
                  </td>
                  <td className="dc-muted">{drone.serial_number}</td>
                  <td className="dc-muted">{drone.manufacturer || "—"}</td>
                  <td>
                    <StatusBadge status={drone.status} kind="drone" />
                  </td>
                  <td className="dc-muted">{drone.health_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
